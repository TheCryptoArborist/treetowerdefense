const reasons=Object.freeze({
 SIGNED_FORMAT:['The wallet returned an unsupported signed transaction. No payment was submitted.',422],
 INVOICE_MISMATCH:['The signed transaction does not match this TREE checkout. Cancel the unpaid checkout and review a new one.',422],
 GAS_OWNER:['The signed transaction uses a different gas payer. This checkout requires the connected wallet to pay its own SUI gas.',422],
 GAS_BUDGET:['The wallet gas budget is outside this checkout’s supported limit. No payment was submitted.',422],
 TRANSFER_COMMANDS:['The wallet transaction contains commands outside the reviewed TREE transfer. No payment was submitted.',422],
 TRANSFER_INPUTS:['The wallet transaction uses an unsupported payment input layout. No payment was submitted.',422],
 TRANSFER_RESULT:['The wallet transaction uses an unsupported transfer result. No payment was submitted.',422],
 TRANSFER_AMOUNT:['The signed TREE amount or recipient differs from the checkout. No payment was submitted.',422],
 COIN_INPUTS:['The wallet transaction contains unsupported or duplicate coin inputs. No payment was submitted.',422],
 SIGNATURE_INVALID:['The wallet signature does not verify for this transaction and wallet. No payment was submitted.',422],
 SIGNATURE_LOOKUP:['Sui signature verification is temporarily unavailable. Check purchase status before retrying.',503],
 COIN_LOOKUP:['Sui coin verification is temporarily unavailable. Check purchase status before retrying.',503],
 COIN_CHANGED:['A TREE or SUI coin changed after wallet approval. Cancel the unpaid checkout and create a new one.',409]
});
export function paymentError(code,cause){const spec=reasons[code];if(!spec)throw Error('Unknown payment error code');return Object.assign(new Error(spec[0],cause?{cause}:undefined),{paymentCode:code,paymentStatus:spec[1]});}
export function publicPaymentError(error){const spec=reasons[error?.paymentCode];return spec?{code:error.paymentCode,error:spec[0],status:spec[1]}:null;}
