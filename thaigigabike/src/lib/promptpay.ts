// PromptPay EMV QR payload generator (Thai standard — static & dynamic)
// Ref: Bank of Thailand PromptPay QR spec (EMVCo-compliant)

function crc16(data: string): string {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
    }
  }
  return ((crc & 0xffff) >>> 0).toString(16).toUpperCase().padStart(4, '0')
}

function tlv(tag: string, value: string): string {
  return `${tag}${String(value.length).padStart(2, '0')}${value}`
}

/**
 * Generate a PromptPay QR payload string.
 * @param phone  Thai mobile number, e.g. "0814249407"
 * @param amount Optional amount in THB (dynamic QR when provided, static when omitted)
 */
export function buildPromptPayPayload(phone: string, amount?: number): string {
  // Normalize: 0814249407 → 0066814249407 (4-digit country prefix, no leading 0)
  const normalized = '0066' + phone.replace(/^0+/, '')

  const merchantAccount =
    tlv('00', 'A000000677010111') + // PromptPay AID
    tlv('01', normalized)           // Mobile number

  const parts: string[] = [
    tlv('00', '01'),                             // Payload Format Indicator = 01
    tlv('01', amount !== undefined ? '12' : '11'), // 12=dynamic (amount), 11=static
    tlv('29', merchantAccount),                  // PromptPay merchant account
    tlv('53', '764'),                            // Currency = THB
    ...(amount !== undefined ? [tlv('54', amount.toFixed(2))] : []),
    tlv('58', 'TH'),                             // Country code
    tlv('59', 'GIGA BIKE FACTORY'),              // Merchant name (max 25 chars)
    tlv('60', 'BANGKOK'),                        // Merchant city
    '6304',                                      // CRC tag + 2-digit length (always 04)
  ]

  const payload = parts.join('')
  return payload + crc16(payload)
}
