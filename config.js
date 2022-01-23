export const config = {
  CONTRACT: "0x31d4Da52c12542AC3D6aAdbA5ed26a3A563a86Dc",
  CHANNEL: process.env.NODE_ENV === 'dev' ? "905859896019419157" : "879088685402980425",
  IPFS: 'https://ipfs.io/ipfs',
  RPC_HTTP: 'https://mainnet.infura.io/v3',
  MARKET: "https://opensea.io/assets",
  MAX_RETRIES: 6
};