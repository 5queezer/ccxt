//  ---------------------------------------------------------------------------
import binance from './binance.js';
//  ---------------------------------------------------------------------------
/**
 * @class aster
 * @augments binance
 * @description Aster DEX - Decentralized exchange supporting spot and perpetual futures trading
 */
export default class aster extends binance {
    describe() {
        return this.deepExtend(super.describe(), {
            'id': 'aster',
            'name': 'Aster',
            'countries': ['SG'],
            'rateLimit': 50,
            'certified': false,
            'pro': true,
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': false,
                'swap': true,
                'future': true,
                'option': false,
                // Disable Binance-specific centralized exchange features
                'borrowCrossMargin': false,
                'borrowIsolatedMargin': false,
                'createConvertTrade': false,
                'fetchBorrowInterest': false,
                'fetchBorrowRateHistory': false,
                'fetchConvertCurrencies': false,
                'fetchConvertQuote': false,
                'fetchConvertTrade': false,
                'fetchConvertTradeHistory': false,
                'fetchCrossBorrowRate': false,
                'fetchIsolatedBorrowRates': false,
                'repayCrossMargin': false,
                'repayIsolatedMargin': false,
                // These features may need testing/verification with actual API
                'fetchCurrencies': undefined,
                'fetchDepositAddress': undefined,
                'fetchDeposits': undefined,
                'fetchDepositWithdrawFees': undefined,
                'fetchTransfers': undefined,
                'fetchWithdrawals': undefined,
                'transfer': undefined,
                'withdraw': undefined,
            },
            'urls': {
                'logo': 'https://static.asterdexstatic.com/cloud-futures/static/images/aster/logo.svg',
                'api': {
                    // Spot API endpoints
                    'public': 'https://api.asterdex.com/api/v3',
                    'private': 'https://api.asterdex.com/api/v3',
                    'v1': 'https://api.asterdex.com/api/v1',
                    // Futures API endpoints
                    'fapiPublic': 'https://fapi.asterdex.com/fapi/v1',
                    'fapiPublicV2': 'https://fapi.asterdex.com/fapi/v2',
                    'fapiPublicV3': 'https://fapi.asterdex.com/fapi/v3',
                    'fapiPrivate': 'https://fapi.asterdex.com/fapi/v1',
                    'fapiPrivateV2': 'https://fapi.asterdex.com/fapi/v2',
                    'fapiPrivateV3': 'https://fapi.asterdex.com/fapi/v3',
                    'fapiData': 'https://fapi.asterdex.com/futures/data',
                    // Note: sapi endpoints may not be available on Aster DEX
                    // These would need to be verified against actual API
                },
                'www': 'https://www.asterdex.com/en/referral/49A4aD',
                'referral': {
                    'url': 'https://www.asterdex.com/en/referral/49A4aD',
                    'discount': 0.1,
                },
                'doc': [
                    'https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation',
                    'https://docs.asterdex.com/product/aster-pro/api',
                    'https://github.com/asterdex/api-docs',
                ],
                'fees': 'https://www.asterdex.com/fees',
            },
            'fees': {
                'trading': {
                    'tierBased': true,
                    'percentage': true,
                    // Spot fees: 0.10% maker, 0.04% taker (from docs)
                    // Futures fees: lower (to be verified)
                    'taker': this.parseNumber('0.0004'),
                    'maker': this.parseNumber('0.001'), // 0.10% for spot
                },
                'future': {
                    'trading': {
                        'tierBased': true,
                        'percentage': true,
                        'taker': this.parseNumber('0.0005'),
                        'maker': this.parseNumber('0.0002'), // 0.02%
                    },
                },
            },
            'options': {
                'fetchMarkets': {
                    'types': ['spot', 'linear'], // Both spot and linear perpetuals
                },
                'defaultSubType': 'linear',
                'leverageBrackets': undefined,
                'marginTypes': {},
                'marginModes': {},
                // Aster-specific options
                'recvWindow': 5000,
                'adjustForTimeDifference': true,
                'defaultTimeInForce': 'GTC',
                'warnOnFetchOpenOrdersWithoutSymbol': true,
            },
        });
    }
}
