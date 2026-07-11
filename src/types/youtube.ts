export interface YouTubeAccount {
  id: string;
  name: string;
  handle: string;
  thumbnail: string;
  connectedAt: string;
  status: 'connected' | 'expiring' | 'disconnected' | 'not_configured';
  subscriberCount?: string;
  nickname?: string;
}

export interface YouTubeAccountState {
  accounts: (YouTubeAccount & { tokens: any })[];
  activeAccountId: string | null;
}
