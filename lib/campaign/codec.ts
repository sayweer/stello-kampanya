/** What this app puts in a ticket's `arg`: `[kind u8][campaign id u64 big-endian]`. */
export const ARG_LENGTH = 9;
export const KIND_PLEDGE = 1;
export const KIND_BONUS = 2;

export type Kind = typeof KIND_PLEDGE | typeof KIND_BONUS;

export function encodeArg(kind: Kind, campaignId: bigint | number): Buffer {
  const arg = Buffer.alloc(ARG_LENGTH);
  arg.writeUInt8(kind, 0);
  arg.writeBigUInt64BE(BigInt(campaignId), 1);
  return arg;
}
