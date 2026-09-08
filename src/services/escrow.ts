import { db } from '../db/index.ts';
import { users, transactions } from '../db/schema.ts';
import { eq, desc, and, gte } from 'drizzle-orm';

export const PLATFORM_FEE_PERCENT = 10; // 10% platform commission

export class EscrowService {
  /**
   * 1. Reserve order budget from client available balance into escrow
   * Protected with database transaction, FOR UPDATE row lock and atomic condition check
   */
  static async reserveOrderFunds(clientId: string, orderId: string, budget: number) {
    console.log(`[ESCROW AUDIT] Reserving ${budget} руб. ПМР for order ${orderId} by client ${clientId}`);

    return await db.transaction(async (tx) => {
      // Row-level lock to prevent concurrent double-spending
      const [client] = await tx
        .select()
        .from(users)
        .where(eq(users.id, clientId))
        .for('update');

      if (!client) {
        throw new Error('Пользователь не найден в системе');
      }

      if (client.balance < budget) {
        throw new Error(
          `Недостаточно средств на балансе. Доступно: ${client.balance.toFixed(2)} руб., требуется: ${budget.toFixed(2)} руб. ПМР. Пополните кошелек перед созданием заказа.`
        );
      }

      const newBalance = Math.round((client.balance - budget) * 100) / 100;
      const newReserved = Math.round((client.reservedBalance + budget) * 100) / 100;

      // Atomic conditional update to safeguard against any out-of-band balance decrement
      const updatedRows = await tx
        .update(users)
        .set({ balance: newBalance, reservedBalance: newReserved })
        .where(and(eq(users.id, clientId), gte(users.balance, budget)))
        .returning();

      if (!updatedRows || updatedRows.length === 0) {
        throw new Error('Ошибка списания средств: параллельная операция изменила доступный баланс');
      }

      const [txRecord] = await tx
        .insert(transactions)
        .values({
          id: `tx-res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId: clientId,
          orderId,
          type: 'reserve',
          amount: budget,
          description: `Резервирование средств в эскроу-сервисе под заказ #${orderId}`,
        })
        .returning();

      return {
        transaction: txRecord,
        newBalance,
        newReserved,
      };
    });
  }

  /**
   * 2. Complete order: release escrow and transfer payout to courier minus platform fee
   * Wrapped in single atomic transaction: rolls back all state if any step fails
   */
  static async releaseAndPayoutOrder(orderId: string, clientId: string, courierId: string, budget: number) {
    console.log(`[ESCROW AUDIT] Releasing escrow for order ${orderId}. Client: ${clientId}, Courier: ${courierId}, Budget: ${budget}`);

    const fee = Math.round((budget * PLATFORM_FEE_PERCENT / 100) * 100) / 100;
    const payout = Math.round((budget - fee) * 100) / 100;

    return await db.transaction(async (tx) => {
      // Row-level lock on client and courier records
      const [client] = await tx.select().from(users).where(eq(users.id, clientId)).for('update');
      const [courier] = await tx.select().from(users).where(eq(users.id, courierId)).for('update');

      let updatedClientReserved = 0;
      let updatedClientBalance = 0;
      if (client) {
        updatedClientReserved = Math.max(0, Math.round((client.reservedBalance - budget) * 100) / 100);
        updatedClientBalance = client.balance;
        await tx.update(users).set({ reservedBalance: updatedClientReserved }).where(eq(users.id, clientId));
      }

      let updatedCourierBalance = 0;
      let updatedCourierReserved = 0;
      if (courier) {
        updatedCourierBalance = Math.round((courier.balance + payout) * 100) / 100;
        updatedCourierReserved = courier.reservedBalance;
        await tx.update(users).set({ balance: updatedCourierBalance }).where(eq(users.id, courierId));
      }

      // Record all transactions atomically
      await tx.insert(transactions).values([
        {
          id: `tx-rel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId: clientId,
          orderId,
          type: 'release',
          amount: budget,
          description: `Списание средств из эскроу по завершению заказа #${orderId}`,
        },
        {
          id: `tx-pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId: courierId,
          orderId,
          type: 'payout',
          amount: payout,
          description: `Выплата за выполнение поручения #${orderId} (за вычетом ${PLATFORM_FEE_PERCENT}% комиссии)`,
        },
        {
          id: `tx-fee-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId: 'admin-1',
          orderId,
          type: 'fee',
          amount: fee,
          description: `Комиссия платформы ${PLATFORM_FEE_PERCENT}% по заказу #${orderId}`,
        },
      ]);

      return {
        payout,
        fee,
        clientWallet: { balance: updatedClientBalance, reservedBalance: updatedClientReserved },
        courierWallet: { balance: updatedCourierBalance, reservedBalance: updatedCourierReserved },
      };
    });
  }

  /**
   * 3. Refund reserved funds when order is canceled or resolved in client's favor
   * Transactional and atomic update
   */
  static async refundOrderFunds(orderId: string, clientId: string, budget: number, reason: string) {
    console.log(`[ESCROW AUDIT] Refunding ${budget} руб. ПМР to client ${clientId} for order ${orderId}. Reason: ${reason}`);

    return await db.transaction(async (tx) => {
      const [client] = await tx.select().from(users).where(eq(users.id, clientId)).for('update');
      if (!client) return { newBalance: 0, newReserved: 0 };

      const newReserved = Math.max(0, Math.round((client.reservedBalance - budget) * 100) / 100);
      const newBalance = Math.round((client.balance + budget) * 100) / 100;

      await tx.update(users)
        .set({ balance: newBalance, reservedBalance: newReserved })
        .where(eq(users.id, clientId));

      await tx.insert(transactions).values({
        id: `tx-ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: clientId,
        orderId,
        type: 'refund',
        amount: budget,
        description: `Возврат средств из эскроу: ${reason}`,
      });

      return { newBalance, newReserved };
    });
  }

  /**
   * 4. Topup user wallet
   * Atomic row lock and balance update
   */
  static async topupWallet(userId: string, amount: number, paymentMethod: string = 'Сбербанк ПМР / АПБ Клевер') {
    return await db.transaction(async (tx) => {
      const [user] = await tx.select().from(users).where(eq(users.id, userId)).for('update');
      if (!user) throw new Error('Пользователь не найден');

      const newBalance = Math.round((user.balance + amount) * 100) / 100;
      await tx.update(users).set({ balance: newBalance }).where(eq(users.id, userId));

      const [txRecord] = await tx.insert(transactions).values({
        id: `tx-top-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId,
        type: 'topup',
        amount,
        description: `Пополнение кошелька через ${paymentMethod}`,
      }).returning();

      return {
        balance: newBalance,
        reservedBalance: user.reservedBalance,
        transaction: txRecord,
      };
    });
  }

  /**
   * 5. Get user balance & transaction history
   */
  static async getUserWallet(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error('Пользователь не найден');

    const userTxs = await db.select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));

    return {
      balance: user.balance,
      reservedBalance: user.reservedBalance,
      transactions: userTxs,
    };
  }
}
