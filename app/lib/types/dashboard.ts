export interface Order {
  orderId: string;
  symbol?: string;
  exchange?: string;
  side?: 'BUY' | 'SELL';
  role?: string;
  type: 'LIMIT' | 'MARKET';
  quantity: number;
  executedQty: number;
  price: number;
  status: 'FILLED' | 'PENDING' | 'CANCELLED';
  commission: number;
  commissionAsset: string;
  commissionUsdt: number;
  filledAt: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TradePnl {
  grossRealized: number;
  totalCommission: number;
  realized: number;
  unrealized: number;
  total: number;
  realizedPercent: number;
  unrealizedPercent: number;
  totalPercent: number;
  entryCost: number;
  realizedQty: number;
  unrealizedQty: number;
  currentMarketPrice: number;
  isComplete: boolean;
  hasDataIntegrityIssue: boolean;
}

export interface Trade {
  tradeId: string;
  entryOrder: Order;
  exitOrders: Order[];
  pnl: TradePnl;
}

export interface TradesSummary {
  totalTrades: number;
  completedTrades: number;
  activeTrades: number;
  totalRealizedPnl: number;
  totalUnrealizedPnl: number;
  totalPnl: number;
  initialBalance: number;
  pnlPercentage: number;
}

export interface TradesApiResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    trades: Trade[];
    summary: TradesSummary;
  };
}
