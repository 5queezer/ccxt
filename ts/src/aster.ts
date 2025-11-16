//  ---------------------------------------------------------------------------

import Exchange from './abstract/aster.js';
import { ExchangeError, ArgumentsRequired, InvalidOrder, InsufficientFunds, OrderNotFound, AuthenticationError, RateLimitExceeded, PermissionDenied, BadRequest, BadSymbol, NotSupported, InvalidNonce, RequestTimeout } from './base/errors.js';
import { Precise } from './base/Precise.js';
import type { Int, OrderSide, Balances, OrderType, Trade, OHLCV, Order, FundingRateHistory, Str, Ticker, OrderBook, Tickers, Market, Strings, Num, Dict, LeverageTiers, int, FundingRate, FundingRates, Position, MarginModification } from './base/types.js';
import { TICK_SIZE } from './base/functions/number.js';
import { sha256 } from './static_dependencies/noble-hashes/sha256.js';

//  ---------------------------------------------------------------------------

/**
 * @class aster
 * @augments Exchange
 */
export default class aster extends Exchange {
    describe (): any {
        return this.deepExtend (super.describe (), {
            'id': 'aster',
            'name': 'Aster',
            'countries': [],
            'rateLimit': 50, // 2400 requests per minute = 1 request per 25ms, using 50ms for safety
            'certified': false,
            'pro': true,
            'dex': true,
            'has': {
                'CORS': undefined,
                'spot': true,
                'margin': false,
                'swap': true,
                'future': true,
                'option': false,
                'addMargin': true,
                'cancelAllOrders': true,
                'cancelOrder': true,
                'cancelOrders': true,
                'createOrder': true,
                'createOrders': true,
                'createPostOnlyOrder': true,
                'createReduceOnlyOrder': true,
                'createStopLimitOrder': true,
                'createStopLossOrder': true,
                'createStopMarketOrder': true,
                'createStopOrder': true,
                'createTakeProfitOrder': true,
                'createTrailingPercentOrder': true,
                'createTriggerOrder': true,
                'editOrder': false,
                'fetchBalance': true,
                'fetchClosedOrders': 'emulated',
                'fetchCurrencies': false,
                'fetchFundingHistory': false,
                'fetchFundingRate': true,
                'fetchFundingRateHistory': true,
                'fetchFundingRates': true,
                'fetchIndexOHLCV': false,
                'fetchLeverage': 'emulated',
                'fetchLeverages': false,
                'fetchLeverageTiers': true,
                'fetchMarginMode': false,
                'fetchMarketLeverageTiers': 'emulated',
                'fetchMarkets': true,
                'fetchMarkOHLCV': false,
                'fetchMyTrades': true,
                'fetchOHLCV': true,
                'fetchOpenInterest': false,
                'fetchOpenOrders': true,
                'fetchOrder': true,
                'fetchOrderBook': true,
                'fetchOrders': true,
                'fetchPosition': true,
                'fetchPositionMode': true,
                'fetchPositions': true,
                'fetchTicker': true,
                'fetchTickers': true,
                'fetchTime': true,
                'fetchTrades': true,
                'reduceMargin': true,
                'setLeverage': true,
                'setMarginMode': true,
                'setPositionMode': true,
                'transfer': false,
                'withdraw': false,
            },
            'timeframes': {
                '1m': '1m',
                '3m': '3m',
                '5m': '5m',
                '15m': '15m',
                '30m': '30m',
                '1h': '1h',
                '2h': '2h',
                '4h': '4h',
                '6h': '6h',
                '8h': '8h',
                '12h': '12h',
                '1d': '1d',
                '3d': '3d',
                '1w': '1w',
                '1M': '1M',
            },
            'urls': {
                'logo': 'https://static.asterdexstatic.com/cloud-futures/static/images/aster/logo.svg',
                'api': {
                    'public': 'https://fapi.asterdex.com',
                    'private': 'https://fapi.asterdex.com',
                },
                'www': 'https://www.asterdex.com/en/referral/49A4aD',
                'doc': [
                    'https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation',
                    'https://github.com/asterdex/api-docs',
                ],
                'fees': 'https://www.asterdex.com/fees',
            },
            'api': {
                'public': {
                    'get': {
                        'fapi/v1/ping': 1,
                        'fapi/v1/time': 1,
                        'fapi/v1/exchangeInfo': 1,
                        'fapi/v1/depth': { 'cost': 2, 'byLimit': [ [ 50, 2 ], [ 100, 5 ], [ 500, 10 ], [ 1000, 20 ] ] },
                        'fapi/v1/trades': 5,
                        'fapi/v1/historicalTrades': 20,
                        'fapi/v1/aggTrades': 20,
                        'fapi/v1/klines': { 'cost': 1, 'byLimit': [ [ 99, 1 ], [ 499, 2 ], [ 1000, 5 ], [ 10000, 10 ] ] },
                        'fapi/v1/premiumIndex': 1,
                        'fapi/v1/fundingRate': 1,
                        'fapi/v1/ticker/24hr': { 'cost': 1, 'noSymbol': 40 },
                        'fapi/v1/ticker/price': { 'cost': 1, 'noSymbol': 2 },
                        'fapi/v1/ticker/bookTicker': { 'cost': 1, 'noSymbol': 2 },
                    },
                },
                'private': {
                    'get': {
                        'fapi/v1/account': 5,
                        'fapi/v1/balance': 5,
                        'fapi/v1/order': 1,
                        'fapi/v1/openOrders': { 'cost': 1, 'noSymbol': 40 },
                        'fapi/v1/allOrders': 5,
                        'fapi/v1/positionRisk': 5,
                        'fapi/v1/positionSide/dual': 30,
                        'fapi/v1/userTrades': 5,
                        'fapi/v1/leverageBracket': 1,
                        'fapi/v1/commissionRate': 20,
                    },
                    'post': {
                        'fapi/v1/order': 4,
                        'fapi/v1/batchOrders': 5,
                        'fapi/v1/leverage': 1,
                        'fapi/v1/marginType': 1,
                        'fapi/v1/positionSide/dual': 1,
                        'fapi/v1/positionMargin': 1,
                        'fapi/v1/listenKey': 1,
                    },
                    'put': {
                        'fapi/v1/listenKey': 1,
                    },
                    'delete': {
                        'fapi/v1/order': 1,
                        'fapi/v1/allOpenOrders': 1,
                        'fapi/v1/batchOrders': 1,
                        'fapi/v1/listenKey': 1,
                    },
                },
            },
            'fees': {
                'trading': {
                    'tierBased': false,
                    'percentage': true,
                    'maker': this.parseNumber ('0.0002'),
                    'taker': this.parseNumber ('0.0004'),
                },
            },
            'requiredCredentials': {
                'apiKey': true,
                'secret': true,
            },
            'exceptions': {
                'exact': {
                    '-1000': ExchangeError, // UNKNOWN - An unknown error occurred while processing the request
                    '-1001': ExchangeError, // DISCONNECTED - Internal error; unable to process your request
                    '-1002': AuthenticationError, // UNAUTHORIZED - You are not authorized to execute this request
                    '-1003': RateLimitExceeded, // TOO_MANY_REQUESTS - Too many requests queued
                    '-1006': ExchangeError, // UNEXPECTED_RESP - An unexpected response was received from the message bus
                    '-1007': RequestTimeout, // TIMEOUT - Timeout waiting for response from backend server
                    '-1010': ExchangeError, // ERROR_MSG_RECEIVED - ERROR_MSG_RECEIVED
                    '-1011': PermissionDenied, // NON_WHITE_LIST - This IP cannot access this route
                    '-1013': InvalidOrder, // INVALID_MESSAGE - INVALID_MESSAGE
                    '-1015': RateLimitExceeded, // TOO_MANY_ORDERS - Too many new orders
                    '-1016': ExchangeError, // SERVICE_SHUTTING_DOWN - This service is no longer available
                    '-1020': NotSupported, // UNSUPPORTED_OPERATION - This operation is not supported
                    '-1021': InvalidNonce, // INVALID_TIMESTAMP - Timestamp for this request is outside of the recvWindow
                    '-1022': AuthenticationError, // INVALID_SIGNATURE - Signature for this request is not valid
                    '-1100': BadRequest, // ILLEGAL_CHARS - Illegal characters found in a parameter
                    '-1101': BadRequest, // TOO_MANY_PARAMETERS - Too many parameters sent for this endpoint
                    '-1102': BadRequest, // MANDATORY_PARAM_EMPTY_OR_MALFORMED - A mandatory parameter was not sent, was empty/null, or malformed
                    '-1103': BadRequest, // UNKNOWN_PARAM - An unknown parameter was sent
                    '-1104': BadRequest, // UNREAD_PARAMETERS - Not all sent parameters were read
                    '-1105': BadRequest, // PARAM_EMPTY - A parameter was empty
                    '-1106': BadRequest, // PARAM_NOT_REQUIRED - A parameter was sent when not required
                    '-1111': BadRequest, // BAD_PRECISION - Precision is over the maximum defined for this asset
                    '-1112': InvalidOrder, // NO_DEPTH - No orders on book for symbol
                    '-1114': BadRequest, // TIF_NOT_REQUIRED - TimeInForce parameter sent when not required
                    '-1115': BadRequest, // INVALID_TIF - Invalid timeInForce
                    '-1116': BadRequest, // INVALID_ORDER_TYPE - Invalid orderType
                    '-1117': BadRequest, // INVALID_SIDE - Invalid side
                    '-1118': BadRequest, // EMPTY_NEW_CL_ORD_ID - New client order ID was empty
                    '-1119': BadRequest, // EMPTY_ORG_CL_ORD_ID - Original client order ID was empty
                    '-1120': BadRequest, // BAD_INTERVAL - Invalid interval
                    '-1121': BadSymbol, // BAD_SYMBOL - Invalid symbol
                    '-1125': AuthenticationError, // INVALID_LISTEN_KEY - This listenKey does not exist
                    '-1127': BadRequest, // MORE_THAN_XX_HOURS - Lookup interval is too big
                    '-1128': BadRequest, // OPTIONAL_PARAMS_BAD_COMBO - Combination of optional parameters invalid
                    '-1130': BadRequest, // INVALID_PARAMETER - Invalid data sent for a parameter
                    '-2010': ExchangeError, // NEW_ORDER_REJECTED - NEW_ORDER_REJECTED
                    '-2011': OrderNotFound, // CANCEL_REJECTED - CANCEL_REJECTED
                    '-2013': OrderNotFound, // NO_SUCH_ORDER - Order does not exist
                    '-2014': AuthenticationError, // BAD_API_KEY_FMT - API-key format invalid
                    '-2015': AuthenticationError, // REJECTED_MBX_KEY - Invalid API-key, IP, or permissions for action
                    '-2016': ExchangeError, // NO_TRADING_WINDOW - No trading window could be found for the symbol
                    '-2018': InsufficientFunds, // BALANCE_NOT_SUFFICIENT - Balance is insufficient
                    '-2019': ExchangeError, // MARGIN_NOT_SUFFICENT - Margin is insufficient
                    '-2020': ExchangeError, // UNABLE_TO_FILL - Unable to fill
                    '-2021': InvalidOrder, // ORDER_WOULD_IMMEDIATELY_TRIGGER - Order would immediately trigger
                    '-2022': InsufficientFunds, // REDUCE_ONLY_REJECT - ReduceOnly Order is rejected
                    '-2023': ExchangeError, // USER_IN_LIQUIDATION - User in liquidation mode now
                    '-2024': InvalidOrder, // POSITION_NOT_SUFFICIENT - Position is not sufficient
                    '-2025': InvalidOrder, // MAX_OPEN_ORDER_EXCEEDED - Reach max open order limit
                    '-2026': InvalidOrder, // REDUCE_ONLY_ORDER_TYPE_NOT_SUPPORTED - This OrderType is not supported when reduceOnly
                    '-4000': BadRequest, // INVALID_ORDER_STATUS - Invalid order status
                    '-4001': BadRequest, // PRICE_LESS_THAN_ZERO - Price less than 0
                    '-4002': BadRequest, // PRICE_GREATER_THAN_MAX_PRICE - Price greater than max price
                    '-4003': BadRequest, // QTY_LESS_THAN_ZERO - Quantity less than zero
                    '-4004': BadRequest, // QTY_LESS_THAN_MIN_QTY - Quantity less than min quantity
                    '-4005': BadRequest, // QTY_GREATER_THAN_MAX_QTY - Quantity greater than max quantity
                    '-4006': BadRequest, // STOP_PRICE_LESS_THAN_ZERO - Stop price less than zero
                    '-4007': BadRequest, // STOP_PRICE_GREATER_THAN_MAX_PRICE - Stop price greater than max price
                    '-4008': BadRequest, // TICK_SIZE_LESS_THAN_ZERO - Tick size less than zero
                    '-4009': BadRequest, // MAX_PRICE_LESS_THAN_MIN_PRICE - Max price less than min price
                    '-4010': BadRequest, // MAX_QTY_LESS_THAN_MIN_QTY - Max qty less than min qty
                    '-4011': BadRequest, // STEP_SIZE_LESS_THAN_ZERO - Step size less than zero
                    '-4012': BadRequest, // MAX_NUM_ORDERS_LESS_THAN_ZERO - Max mum orders less than zero
                    '-4013': BadRequest, // PRICE_LESS_THAN_MIN_PRICE - Price less than min price
                    '-4014': BadRequest, // PRICE_NOT_INCREASED_BY_TICK_SIZE - Price not increased by tick size
                    '-4015': BadRequest, // INVALID_CL_ORD_ID_LEN - Client order id is not valid
                    '-4016': BadRequest, // PRICE_HIGHTER_THAN_MULTIPLIER_UP - Price is higher than mark price multiplier cap
                    '-4017': BadRequest, // MULTIPLIER_UP_LESS_THAN_ZERO - Multiplier up less than zero
                    '-4018': BadRequest, // MULTIPLIER_DOWN_LESS_THAN_ZERO - Multiplier down less than zero
                    '-4019': BadRequest, // COMPOSITE_SCALE_OVERFLOW - Composite scale too large
                    '-4020': BadRequest, // TARGET_STRATEGY_INVALID - Target strategy invalid
                    '-4021': BadRequest, // INVALID_DEPTH_LIMIT - Invalid depth limit
                    '-4022': BadRequest, // WRONG_MARKET_STATUS - market status not support this request
                    '-4023': BadRequest, // QTY_NOT_INCREASED_BY_STEP_SIZE - Qty not increased by step size
                    '-4024': BadRequest, // PRICE_LOWER_THAN_MULTIPLIER_DOWN - Price is lower than mark price multiplier floor
                    '-4025': BadRequest, // MULTIPLIER_DECIMAL_LESS_THAN_ZERO - Multiplier decimal less than zero
                    '-4026': BadRequest, // COMMISSION_INVALID - Commission invalid
                    '-4027': BadRequest, // INVALID_ACCOUNT_TYPE - Invalid account type
                    '-4028': BadRequest, // INVALID_LEVERAGE - Invalid leverage
                    '-4029': BadRequest, // INVALID_TICK_SIZE_PRECISION - Tick size precision is invalid
                    '-4030': BadRequest, // INVALID_STEP_SIZE_PRECISION - Step size precision is invalid
                    '-4031': BadRequest, // INVALID_WORKING_TYPE - Invalid working type
                    '-4032': BadRequest, // EXCEED_MAX_CANCEL_ORDER_SIZE - Exceed max cancel order size
                    '-4033': BadRequest, // INSURANCE_ACCOUNT_NOT_FOUND - Insurance account not found
                    '-4044': BadRequest, // INVALID_BALANCE_TYPE - Balance Type is invalid
                    '-4045': BadRequest, // MAX_STOP_ORDER_EXCEEDED - Reach max stop order limit
                    '-4046': BadRequest, // NO_NEED_TO_CHANGE_MARGIN_TYPE - No need to change margin type
                    '-4047': BadRequest, // THERE_EXISTS_OPEN_ORDERS - There exists open orders
                    '-4048': BadRequest, // THERE_EXISTS_QUANTITY - There exists quantity
                    '-4049': BadRequest, // ADD_ISOLATED_MARGIN_REJECT - Add margin only support for isolated position
                    '-4050': BadRequest, // CROSS_BALANCE_INSUFFICIENT - Cross balance insufficient
                    '-4051': BadRequest, // ISOLATED_BALANCE_INSUFFICIENT - Isolated balance insufficient
                    '-4052': BadRequest, // NO_NEED_TO_CHANGE_AUTO_ADD_MARGIN - No need to change auto add margin
                    '-4053': BadRequest, // AUTO_ADD_CROSSED_MARGIN_REJECT - Auto add margin only support for isolated position
                    '-4054': BadRequest, // ADD_ISOLATED_MARGIN_NO_POSITION_REJECT - Add margin only support for position with same direction
                    '-4055': BadRequest, // AMOUNT_MUST_BE_POSITIVE - Amount must be positive
                    '-4056': BadRequest, // INVALID_API_KEY_TYPE - Invalid api key type
                    '-4057': BadRequest, // INVALID_RSA_PUBLIC_KEY - Invalid api public key
                    '-4058': BadRequest, // MAX_PRICE_TOO_LARGE - Max price too large
                    '-4059': BadRequest, // NO_PLACE_ORDER_IN_SETTLING - You can not place orders in settling
                    '-4060': BadRequest, // INVALID_TIME_INTERVAL - Invalid time interval
                    '-4061': BadRequest, // INVALID_AGGREGATED_TRADES_ID - Invalid aggregated trades id
                    '-4062': BadRequest, // INVALID_PRICE_LIMIT_POINT - Invalid price limit point
                    '-4063': BadRequest, // ORDER_FILLED - Order is filled
                    '-4064': BadRequest, // QUANTITY_HAS_BEEN_FILLED - Order has been filled
                    '-4065': BadRequest, // QUANTITY_NOT_INCREASED_BY_STEP_SIZE - Quantity not increased by step size
                    '-4066': BadRequest, // PRICE_LESS_THAN_ZERO_FOR_MARKET - Price less than zero for market order
                    '-4067': BadRequest, // QUANTITY_LESS_THAN_ZERO_FOR_MARKET - Quantity less than zero for market order
                    '-4068': BadRequest, // REDUCE_ONLY_CONFLICT - Reduce only conflict with order type
                    '-4069': BadRequest, // INVALID_WORKING_FLOOR - Invalid working floor
                    '-4070': BadRequest, // INVALID_ACTIVATION_PRICE - Invalid activation price
                    '-4071': BadRequest, // INVALID_CALLBACK_RATE - Invalid callback rate
                    '-4072': BadRequest, // INVALID_INSURANCE_FEE_RATIO - Invalid insurance fee ratio
                },
                'broad': {
                    'has no operation privilege': PermissionDenied,
                    'MAX_POSITION': InvalidOrder,
                },
            },
            'precisionMode': TICK_SIZE,
            'options': {
                'defaultType': 'swap', // 'spot', 'swap', 'future'
                'defaultSubType': 'linear', // 'linear', 'inverse'
                'adjustForTimeDifference': false,
                'recvWindow': 5000,
                'timeDifference': 0,
                'defaultTimeInForce': 'GTC',
                'fetchPositions': {
                    'method': 'fapiPrivateGetPositionRisk', // or 'fapiPrivateV2GetPositionRisk'
                },
                'fetchOrders': {
                    'method': 'fapiPrivateGetAllOrders',
                },
                'broker': {
                    'spot': 'x-CCXT',
                    'margin': 'x-CCXT',
                    'future': 'x-CCXT',
                    'swap': 'x-CCXT',
                },
            },
            'features': {},
        });
    }

    nonce () {
        return this.milliseconds () - this.safeInteger (this.options, 'timeDifference', 0);
    }

    async fetchTime (params = {}): Promise<number> {
        /**
         * @method
         * @name aster#fetchTime
         * @description fetches the current integer timestamp in milliseconds from the exchange server
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {int} the current integer timestamp in milliseconds from the exchange server
         */
        const response = await this.publicGetFapiV1Time (params);
        //
        //     {
        //         "serverTime": 1699999999999
        //     }
        //
        return this.safeInteger (response, 'serverTime');
    }

    async fetchMarkets (params = {}): Promise<Market[]> {
        /**
         * @method
         * @name aster#fetchMarkets
         * @description retrieves data on all markets for aster
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} an array of objects representing market data
         */
        const response = await this.publicGetFapiV1ExchangeInfo (params);
        //
        //     {
        //         "timezone": "UTC",
        //         "serverTime": 1699999999999,
        //         "rateLimits": [...],
        //         "exchangeFilters": [],
        //         "symbols": [
        //             {
        //                 "symbol": "BTCUSDT",
        //                 "pair": "BTCUSDT",
        //                 "contractType": "PERPETUAL",
        //                 "deliveryDate": 4133404800000,
        //                 "onboardDate": 1569398400000,
        //                 "status": "TRADING",
        //                 "maintMarginPercent": "2.5000",
        //                 "requiredMarginPercent": "5.0000",
        //                 "baseAsset": "BTC",
        //                 "quoteAsset": "USDT",
        //                 "marginAsset": "USDT",
        //                 "pricePrecision": 2,
        //                 "quantityPrecision": 3,
        //                 "baseAssetPrecision": 8,
        //                 "quotePrecision": 8,
        //                 "underlyingType": "COIN",
        //                 "underlyingSubType": ["PoW"],
        //                 "filters": [...]
        //             }
        //         ]
        //     }
        //
        const markets = this.safeList (response, 'symbols', []);
        const result = [];
        for (let i = 0; i < markets.length; i++) {
            const market = markets[i];
            result.push (this.parseMarket (market));
        }
        if (this.safeBool (this.options, 'adjustForTimeDifference', false)) {
            await this.loadTimeDifference ();
        }
        return result;
    }

    parseMarket (market: Dict): Market {
        //
        //     {
        //         "symbol": "BTCUSDT",
        //         "pair": "BTCUSDT",
        //         "contractType": "PERPETUAL",
        //         "deliveryDate": 4133404800000,
        //         "onboardDate": 1569398400000,
        //         "status": "TRADING",
        //         "maintMarginPercent": "2.5000",
        //         "requiredMarginPercent": "5.0000",
        //         "baseAsset": "BTC",
        //         "quoteAsset": "USDT",
        //         "marginAsset": "USDT",
        //         "pricePrecision": 2,
        //         "quantityPrecision": 3,
        //         "baseAssetPrecision": 8,
        //         "quotePrecision": 8,
        //         "underlyingType": "COIN",
        //         "underlyingSubType": ["PoW"],
        //         "filters": [
        //             { "filterType": "PRICE_FILTER", "minPrice": "0.01", "maxPrice": "1000000", "tickSize": "0.01" },
        //             { "filterType": "LOT_SIZE", "minQty": "0.001", "maxQty": "1000", "stepSize": "0.001" },
        //             { "filterType": "MARKET_LOT_SIZE", "minQty": "0.001", "maxQty": "1000", "stepSize": "0.001" },
        //             { "filterType": "MAX_NUM_ORDERS", "limit": 200 },
        //             { "filterType": "MAX_NUM_ALGO_ORDERS", "limit": 10 },
        //             { "filterType": "MIN_NOTIONAL", "notional": "5" },
        //             { "filterType": "PERCENT_PRICE", "multiplierUp": "1.0500", "multiplierDown": "0.9500", "multiplierDecimal": "4" }
        //         ]
        //     }
        //
        const id = this.safeString (market, 'symbol');
        const baseId = this.safeString (market, 'baseAsset');
        const quoteId = this.safeString (market, 'quoteAsset');
        const base = this.safeCurrencyCode (baseId);
        const quote = this.safeCurrencyCode (quoteId);
        const settle = this.safeCurrencyCode (quoteId);
        let symbol = base + '/' + quote;
        const contractType = this.safeString (market, 'contractType');
        const swap = (contractType === 'PERPETUAL');
        const future = !swap;
        // Add settle suffix for contract markets (like Binance)
        if (swap) {
            symbol = symbol + ':' + settle;
        } else if (future) {
            const expiry = this.safeInteger (market, 'deliveryDate');
            symbol = symbol + ':' + settle + '-' + this.yymmdd (expiry);
        }
        const status = this.safeString (market, 'status');
        const filters = this.safeList (market, 'filters', []);
        const filtersByType = this.indexBy (filters, 'filterType');
        const priceFilter = this.safeDict (filtersByType, 'PRICE_FILTER', {});
        const lotSizeFilter = this.safeDict (filtersByType, 'LOT_SIZE', {});
        const marketLotSizeFilter = this.safeDict (filtersByType, 'MARKET_LOT_SIZE', {});
        const minNotionalFilter = this.safeDict (filtersByType, 'MIN_NOTIONAL', {});
        return {
            'id': id,
            'symbol': symbol,
            'base': base,
            'quote': quote,
            'settle': settle,
            'baseId': baseId,
            'quoteId': quoteId,
            'settleId': quoteId,
            'type': swap ? 'swap' : 'future',
            'spot': false,
            'margin': false,
            'swap': swap,
            'future': future,
            'option': false,
            'active': (status === 'TRADING'),
            'contract': true,
            'linear': true,
            'inverse': false,
            'contractSize': this.parseNumber ('1'),
            'expiry': swap ? undefined : this.safeInteger (market, 'deliveryDate'),
            'expiryDatetime': swap ? undefined : this.iso8601 (this.safeInteger (market, 'deliveryDate')),
            'strike': undefined,
            'optionType': undefined,
            'precision': {
                'amount': this.parseNumber (this.parsePrecision (this.safeString (market, 'quantityPrecision'))),
                'price': this.parseNumber (this.parsePrecision (this.safeString (market, 'pricePrecision'))),
            },
            'limits': {
                'leverage': {
                    'min': this.parseNumber ('1'),
                    'max': this.parseNumber ('1001'),
                },
                'amount': {
                    'min': this.safeNumber (lotSizeFilter, 'minQty'),
                    'max': this.safeNumber (lotSizeFilter, 'maxQty'),
                },
                'price': {
                    'min': this.safeNumber (priceFilter, 'minPrice'),
                    'max': this.safeNumber (priceFilter, 'maxPrice'),
                },
                'cost': {
                    'min': this.safeNumber (minNotionalFilter, 'notional'),
                    'max': undefined,
                },
                'market': {
                    'min': this.safeNumber (marketLotSizeFilter, 'minQty'),
                    'max': this.safeNumber (marketLotSizeFilter, 'maxQty'),
                },
            },
            'created': this.safeInteger (market, 'onboardDate'),
            'info': market,
        };
    }

    async fetchTicker (symbol: string, params = {}): Promise<Ticker> {
        /**
         * @method
         * @name aster#fetchTicker
         * @description fetches a price ticker, a statistical calculation with the information calculated over the past 24 hours for a specific market
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string} symbol unified symbol of the market to fetch the ticker for
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a [ticker structure]{@link https://docs.ccxt.com/#/?id=ticker-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        const response = await this.publicGetFapiV1Ticker24hr (this.extend (request, params));
        //
        //     {
        //         "symbol": "BTCUSDT",
        //         "priceChange": "84.00000000",
        //         "priceChangePercent": "0.192",
        //         "weightedAvgPrice": "43752.35000000",
        //         "lastPrice": "43795.60000000",
        //         "lastQty": "0.001",
        //         "openPrice": "43711.60000000",
        //         "highPrice": "44100.00000000",
        //         "lowPrice": "43000.00000000",
        //         "volume": "315.206",
        //         "quoteVolume": "13789254.34280000",
        //         "openTime": 1699999999999,
        //         "closeTime": 1699999999999,
        //         "firstId": 1695000000,
        //         "lastId": 1695100000,
        //         "count": 100000
        //     }
        //
        return this.parseTicker (response, market);
    }

    async fetchTickers (symbols: Strings = undefined, params = {}): Promise<Tickers> {
        /**
         * @method
         * @name aster#fetchTickers
         * @description fetches price tickers for multiple markets, statistical information calculated over the past 24 hours for each market
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string[]|undefined} symbols unified symbols of the markets to fetch the ticker for, all market tickers are returned if not assigned
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a dictionary of [ticker structures]{@link https://docs.ccxt.com/#/?id=ticker-structure}
         */
        await this.loadMarkets ();
        const response = await this.publicGetFapiV1Ticker24hr (params);
        //
        //     [
        //         {
        //             "symbol": "BTCUSDT",
        //             "priceChange": "84.00000000",
        //             "priceChangePercent": "0.192",
        //             ...
        //         },
        //         ...
        //     ]
        //
        return this.parseTickers (response, symbols, params);
    }

    parseTicker (ticker: Dict, market: Market = undefined): Ticker {
        //
        //     {
        //         "symbol": "BTCUSDT",
        //         "priceChange": "84.00000000",
        //         "priceChangePercent": "0.192",
        //         "weightedAvgPrice": "43752.35000000",
        //         "lastPrice": "43795.60000000",
        //         "lastQty": "0.001",
        //         "openPrice": "43711.60000000",
        //         "highPrice": "44100.00000000",
        //         "lowPrice": "43000.00000000",
        //         "volume": "315.206",
        //         "quoteVolume": "13789254.34280000",
        //         "openTime": 1699999999999,
        //         "closeTime": 1699999999999,
        //         "firstId": 1695000000,
        //         "lastId": 1695100000,
        //         "count": 100000
        //     }
        //
        const marketId = this.safeString (ticker, 'symbol');
        market = this.safeMarket (marketId, market);
        const timestamp = this.safeInteger (ticker, 'closeTime');
        const last = this.safeString (ticker, 'lastPrice');
        return this.safeTicker ({
            'symbol': market['symbol'],
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': this.safeString (ticker, 'highPrice'),
            'low': this.safeString (ticker, 'lowPrice'),
            'bid': undefined,
            'bidVolume': undefined,
            'ask': undefined,
            'askVolume': undefined,
            'vwap': this.safeString (ticker, 'weightedAvgPrice'),
            'open': this.safeString (ticker, 'openPrice'),
            'close': last,
            'last': last,
            'previousClose': undefined,
            'change': this.safeString (ticker, 'priceChange'),
            'percentage': this.safeString (ticker, 'priceChangePercent'),
            'average': undefined,
            'baseVolume': this.safeString (ticker, 'volume'),
            'quoteVolume': this.safeString (ticker, 'quoteVolume'),
            'info': ticker,
        }, market);
    }

    async fetchOrderBook (symbol: string, limit: Int = undefined, params = {}): Promise<OrderBook> {
        /**
         * @method
         * @name aster#fetchOrderBook
         * @description fetches information on open orders with bid (buy) and ask (sell) prices, volumes and other data
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string} symbol unified symbol of the market to fetch the order book for
         * @param {int} [limit] the maximum amount of order book entries to return
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} A dictionary of [order book structures]{@link https://docs.ccxt.com/#/?id=order-book-structure} indexed by market symbols
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        if (limit !== undefined) {
            request['limit'] = limit; // default 100; max 1000
        }
        const response = await this.publicGetFapiV1Depth (this.extend (request, params));
        //
        //     {
        //         "lastUpdateId": 1699999999999,
        //         "E": 1699999999999,  // Message output time
        //         "T": 1699999999999,  // Transaction time
        //         "bids": [
        //             ["43795.60", "10.000"],
        //             ["43795.50", "5.000"],
        //             ...
        //         ],
        //         "asks": [
        //             ["43795.70", "8.000"],
        //             ["43795.80", "12.000"],
        //             ...
        //         ]
        //     }
        //
        const timestamp = this.safeInteger (response, 'T');
        const orderbook = this.parseOrderBook (response, market['symbol'], timestamp);
        orderbook['nonce'] = this.safeInteger (response, 'lastUpdateId');
        return orderbook;
    }

    async fetchTrades (symbol: string, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        /**
         * @method
         * @name aster#fetchTrades
         * @description get the list of most recent trades for a particular symbol
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string} symbol unified symbol of the market to fetch trades for
         * @param {int} [since] timestamp in ms of the earliest trade to fetch
         * @param {int} [limit] the maximum amount of trades to fetch
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {Trade[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=public-trades}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        if (limit !== undefined) {
            request['limit'] = limit; // default 500, max 1000
        }
        const response = await this.publicGetFapiV1Trades (this.extend (request, params));
        //
        //     [
        //         {
        //             "id": 123456789,
        //             "price": "43795.60",
        //             "qty": "0.001",
        //             "quoteQty": "43.79560",
        //             "time": 1699999999999,
        //             "isBuyerMaker": false
        //         },
        //         ...
        //     ]
        //
        return this.parseTrades (response, market, since, limit);
    }

    parseTrade (trade: Dict, market: Market = undefined): Trade {
        //
        // public fetchTrades
        //
        //     {
        //         "id": 123456789,
        //         "price": "43795.60",
        //         "qty": "0.001",
        //         "quoteQty": "43.79560",
        //         "time": 1699999999999,
        //         "isBuyerMaker": false
        //     }
        //
        // private fetchMyTrades
        //
        //     {
        //         "buyer": false,
        //         "commission": "0.00004380",
        //         "commissionAsset": "USDT",
        //         "id": 123456789,
        //         "maker": false,
        //         "orderId": 987654321,
        //         "price": "43795.60",
        //         "qty": "0.001",
        //         "quoteQty": "43.79560",
        //         "realizedPnl": "0",
        //         "side": "BUY",
        //         "positionSide": "BOTH",
        //         "symbol": "BTCUSDT",
        //         "time": 1699999999999
        //     }
        //
        const id = this.safeString (trade, 'id');
        const timestamp = this.safeInteger (trade, 'time');
        const price = this.safeString (trade, 'price');
        const amount = this.safeString (trade, 'qty');
        const cost = this.safeString (trade, 'quoteQty');
        const marketId = this.safeString (trade, 'symbol');
        market = this.safeMarket (marketId, market);
        let side = this.safeString (trade, 'side');
        if (side === undefined) {
            const isBuyerMaker = this.safeBool (trade, 'isBuyerMaker');
            if (isBuyerMaker !== undefined) {
                side = isBuyerMaker ? 'sell' : 'buy';
            }
        } else {
            side = side.toLowerCase ();
        }
        const orderId = this.safeString (trade, 'orderId');
        let takerOrMaker = undefined;
        const maker = this.safeBool (trade, 'maker');
        if (maker !== undefined) {
            takerOrMaker = maker ? 'maker' : 'taker';
        }
        let fee = undefined;
        const feeCost = this.safeString (trade, 'commission');
        if (feeCost !== undefined) {
            const feeCurrencyId = this.safeString (trade, 'commissionAsset');
            const feeCurrency = this.safeCurrencyCode (feeCurrencyId);
            fee = {
                'cost': feeCost,
                'currency': feeCurrency,
            };
        }
        return this.safeTrade ({
            'id': id,
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': market['symbol'],
            'order': orderId,
            'type': undefined,
            'side': side,
            'takerOrMaker': takerOrMaker,
            'price': price,
            'amount': amount,
            'cost': cost,
            'fee': fee,
        }, market);
    }

    async fetchOHLCV (symbol: string, timeframe = '1m', since: Int = undefined, limit: Int = undefined, params = {}): Promise<OHLCV[]> {
        /**
         * @method
         * @name aster#fetchOHLCV
         * @description fetches historical candlestick data containing the open, high, low, and close price, and the volume of a market
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string} symbol unified symbol of the market to fetch OHLCV data for
         * @param {string} timeframe the length of time each candle represents
         * @param {int} [since] timestamp in ms of the earliest candle to fetch
         * @param {int} [limit] the maximum amount of candles to fetch
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {int[][]} A list of candles ordered as timestamp, open, high, low, close, volume
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
            'interval': this.safeString (this.timeframes, timeframe, timeframe),
        };
        if (since !== undefined) {
            request['startTime'] = since;
        }
        if (limit !== undefined) {
            request['limit'] = limit; // default 500, max 1500
        }
        const response = await this.publicGetFapiV1Klines (this.extend (request, params));
        //
        //     [
        //         [
        //             1699999999999,    // Open time
        //             "43795.60",       // Open
        //             "43800.00",       // High
        //             "43790.00",       // Low
        //             "43798.50",       // Close
        //             "10.000",         // Volume
        //             1699999999999,    // Close time
        //             "437982.5",       // Quote asset volume
        //             100,              // Number of trades
        //             "5.000",          // Taker buy base asset volume
        //             "218991.25",      // Taker buy quote asset volume
        //             "0"               // Ignore
        //         ],
        //         ...
        //     ]
        //
        return this.parseOHLCVs (response, market, timeframe, since, limit);
    }

    parseOHLCV (ohlcv, market: Market = undefined): OHLCV {
        //
        //     [
        //         1699999999999,    // Open time
        //         "43795.60",       // Open
        //         "43800.00",       // High
        //         "43790.00",       // Low
        //         "43798.50",       // Close
        //         "10.000",         // Volume
        //         1699999999999,    // Close time
        //         "437982.5",       // Quote asset volume
        //         100,              // Number of trades
        //         "5.000",          // Taker buy base asset volume
        //         "218991.25",      // Taker buy quote asset volume
        //         "0"               // Ignore
        //     ]
        //
        return [
            this.safeInteger (ohlcv, 0), // timestamp
            this.safeNumber (ohlcv, 1),  // open
            this.safeNumber (ohlcv, 2),  // high
            this.safeNumber (ohlcv, 3),  // low
            this.safeNumber (ohlcv, 4),  // close
            this.safeNumber (ohlcv, 5),  // volume
        ];
    }

    async fetchBalance (params = {}): Promise<Balances> {
        /**
         * @method
         * @name aster#fetchBalance
         * @description query for balance and get the amount of funds available for trading or funds locked in orders
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a [balance structure]{@link https://docs.ccxt.com/#/?id=balance-structure}
         */
        await this.loadMarkets ();
        const response = await this.privateGetFapiV1Account (params);
        //
        //     {
        //         "feeTier": 0,
        //         "canTrade": true,
        //         "canDeposit": true,
        //         "canWithdraw": true,
        //         "updateTime": 0,
        //         "totalInitialMargin": "0.00000000",
        //         "totalMaintMargin": "0.00000000",
        //         "totalWalletBalance": "1000.00000000",
        //         "totalUnrealizedProfit": "0.00000000",
        //         "totalMarginBalance": "1000.00000000",
        //         "totalPositionInitialMargin": "0.00000000",
        //         "totalOpenOrderInitialMargin": "0.00000000",
        //         "totalCrossWalletBalance": "1000.00000000",
        //         "totalCrossUnPnl": "0.00000000",
        //         "availableBalance": "1000.00000000",
        //         "maxWithdrawAmount": "1000.00000000",
        //         "assets": [
        //             {
        //                 "asset": "USDT",
        //                 "walletBalance": "1000.00000000",
        //                 "unrealizedProfit": "0.00000000",
        //                 "marginBalance": "1000.00000000",
        //                 "maintMargin": "0.00000000",
        //                 "initialMargin": "0.00000000",
        //                 "positionInitialMargin": "0.00000000",
        //                 "openOrderInitialMargin": "0.00000000",
        //                 "maxWithdrawAmount": "1000.00000000",
        //                 "crossWalletBalance": "1000.00000000",
        //                 "crossUnPnl": "0.00000000",
        //                 "availableBalance": "1000.00000000"
        //             }
        //         ],
        //         "positions": []
        //     }
        //
        return this.parseBalance (response);
    }

    parseBalance (response): Balances {
        const result = {
            'info': response,
            'timestamp': undefined,
            'datetime': undefined,
        };
        const assets = this.safeList (response, 'assets', []);
        for (let i = 0; i < assets.length; i++) {
            const balance = assets[i];
            const currencyId = this.safeString (balance, 'asset');
            const code = this.safeCurrencyCode (currencyId);
            const account = this.account ();
            account['free'] = this.safeString (balance, 'availableBalance');
            account['used'] = this.safeString (balance, 'initialMargin');
            account['total'] = this.safeString (balance, 'walletBalance');
            result[code] = account;
        }
        return this.safeBalance (result);
    }

    async createOrder (symbol: string, type: OrderType, side: OrderSide, amount: number, price: Num = undefined, params = {}): Promise<Order> {
        /**
         * @method
         * @name aster#createOrder
         * @description create a trade order
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string} symbol unified symbol of the market to create an order in
         * @param {string} type 'market' or 'limit'
         * @param {string} side 'buy' or 'sell'
         * @param {float} amount how much of currency you want to trade in units of base currency
         * @param {float} [price] the price at which the order is to be fulfilled, in units of the quote currency, ignored in market orders
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @param {string} [params.positionSide] 'BOTH', 'LONG', or 'SHORT' - required for hedge mode
         * @param {bool} [params.reduceOnly] true or false - indicates if this order is reduce only
         * @param {string} [params.timeInForce] 'GTC', 'IOC', 'FOK', or 'GTX'
         * @param {float} [params.stopPrice] the price at which a trigger order is triggered at
         * @param {string} [params.workingType] 'MARK_PRICE' or 'CONTRACT_PRICE' - default is 'CONTRACT_PRICE'
         * @param {string} [params.priceProtect] 'TRUE' or 'FALSE' - default is 'FALSE'
         * @param {string} [params.newClientOrderId] a unique id for the order
         * @param {float} [params.activationPrice] activation price for TRAILING_STOP_MARKET orders
         * @param {float} [params.callbackRate] callback rate for TRAILING_STOP_MARKET orders (e.g., 1 for 1%)
         * @returns {object} an [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const uppercaseType = type.toUpperCase ();
        const request = {
            'symbol': market['id'],
            'side': side.toUpperCase (),
            'type': uppercaseType,
        };
        const isMarket = (uppercaseType === 'MARKET');
        const isLimit = (uppercaseType === 'LIMIT');
        const isStop = (uppercaseType.indexOf ('STOP') >= 0);
        const isTakeProfit = (uppercaseType.indexOf ('TAKE_PROFIT') >= 0);
        const isTrailingStop = (uppercaseType === 'TRAILING_STOP_MARKET');
        if (isLimit) {
            request['price'] = this.priceToPrecision (symbol, price);
            request['timeInForce'] = this.safeString (params, 'timeInForce', this.options['defaultTimeInForce']);
        }
        if (isMarket || isStop || isTakeProfit || isTrailingStop) {
            // For market orders and conditional orders, quantity is required
            request['quantity'] = this.amountToPrecision (symbol, amount);
        } else {
            request['quantity'] = this.amountToPrecision (symbol, amount);
        }
        if (isStop || isTakeProfit) {
            const stopPrice = this.safeNumber2 (params, 'stopPrice', 'triggerPrice');
            if (stopPrice === undefined) {
                throw new ArgumentsRequired (this.id + ' createOrder() requires a stopPrice or triggerPrice parameter for ' + uppercaseType + ' orders');
            }
            request['stopPrice'] = this.priceToPrecision (symbol, stopPrice);
        }
        if (isTrailingStop) {
            const callbackRate = this.safeNumber (params, 'callbackRate');
            if (callbackRate === undefined) {
                throw new ArgumentsRequired (this.id + ' createOrder() requires a callbackRate parameter for TRAILING_STOP_MARKET orders');
            }
            request['callbackRate'] = callbackRate;
            const activationPrice = this.safeNumber (params, 'activationPrice');
            if (activationPrice !== undefined) {
                request['activationPrice'] = this.priceToPrecision (symbol, activationPrice);
            }
        }
        const positionSide = this.safeString (params, 'positionSide');
        if (positionSide !== undefined) {
            request['positionSide'] = positionSide;
        }
        const reduceOnly = this.safeBool (params, 'reduceOnly');
        if (reduceOnly !== undefined) {
            request['reduceOnly'] = reduceOnly ? 'true' : 'false';
        }
        const clientOrderId = this.safeString (params, 'newClientOrderId');
        if (clientOrderId !== undefined) {
            request['newClientOrderId'] = clientOrderId;
        }
        const workingType = this.safeString (params, 'workingType');
        if (workingType !== undefined) {
            request['workingType'] = workingType;
        }
        const priceProtect = this.safeString (params, 'priceProtect');
        if (priceProtect !== undefined) {
            request['priceProtect'] = priceProtect;
        }
        params = this.omit (params, [ 'positionSide', 'reduceOnly', 'newClientOrderId', 'stopPrice', 'triggerPrice', 'callbackRate', 'activationPrice', 'workingType', 'priceProtect', 'timeInForce' ]);
        const response = await this.privatePostFapiV1Order (this.extend (request, params));
        //
        //     {
        //         "clientOrderId": "testOrder",
        //         "cumQty": "0",
        //         "cumQuote": "0",
        //         "executedQty": "0",
        //         "orderId": 22542179,
        //         "avgPrice": "0.00000",
        //         "origQty": "10",
        //         "price": "0",
        //         "reduceOnly": false,
        //         "side": "BUY",
        //         "positionSide": "SHORT",
        //         "status": "NEW",
        //         "stopPrice": "0",
        //         "closePosition": false,
        //         "symbol": "BTCUSDT",
        //         "timeInForce": "GTC",
        //         "type": "TRAILING_STOP_MARKET",
        //         "origType": "TRAILING_STOP_MARKET",
        //         "activatePrice": "9020",
        //         "priceRate": "0.3",
        //         "updateTime": 1566818724722,
        //         "workingType": "CONTRACT_PRICE",
        //         "priceProtect": false
        //     }
        //
        return this.parseOrder (response, market);
    }

    async cancelOrder (id: string, symbol: Str = undefined, params = {}): Promise<Order> {
        /**
         * @method
         * @name aster#cancelOrder
         * @description cancels an open order
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string} id order id
         * @param {string} symbol unified symbol of the market the order was made in
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} An [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' cancelOrder() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        const clientOrderId = this.safeString (params, 'origClientOrderId');
        if (clientOrderId !== undefined) {
            request['origClientOrderId'] = clientOrderId;
        } else {
            request['orderId'] = parseInt (id);
        }
        params = this.omit (params, [ 'origClientOrderId' ]);
        const response = await this.privateDeleteFapiV1Order (this.extend (request, params));
        //
        //     {
        //         "clientOrderId": "myOrder1",
        //         "cumQty": "0",
        //         "cumQuote": "0",
        //         "executedQty": "0",
        //         "orderId": 283194212,
        //         "origQty": "11",
        //         "origType": "TRAILING_STOP_MARKET",
        //         "price": "0",
        //         "reduceOnly": false,
        //         "side": "BUY",
        //         "positionSide": "SHORT",
        //         "status": "CANCELED",
        //         "stopPrice": "9300",
        //         "closePosition": false,
        //         "symbol": "BTCUSDT",
        //         "timeInForce": "GTC",
        //         "type": "TRAILING_STOP_MARKET",
        //         "activatePrice": "9020",
        //         "priceRate": "0.3",
        //         "updateTime": 1571110484038,
        //         "workingType": "CONTRACT_PRICE",
        //         "priceProtect": false
        //     }
        //
        return this.parseOrder (response, market);
    }

    async cancelAllOrders (symbol: Str = undefined, params = {}): Promise<Order[]> {
        /**
         * @method
         * @name aster#cancelAllOrders
         * @description cancel all open orders in a market
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string} symbol unified market symbol of the market to cancel orders in
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' cancelAllOrders() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        const response = await this.privateDeleteFapiV1AllOpenOrders (this.extend (request, params));
        //
        //     {
        //         "code": "200",
        //         "msg": "The operation of cancel all open order is done."
        //     }
        //
        return response;
    }

    async fetchOrder (id: string, symbol: Str = undefined, params = {}): Promise<Order> {
        /**
         * @method
         * @name aster#fetchOrder
         * @description fetches information on an order made by the user
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string} symbol unified symbol of the market the order was made in
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} An [order structure]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchOrder() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        const clientOrderId = this.safeString (params, 'origClientOrderId');
        if (clientOrderId !== undefined) {
            request['origClientOrderId'] = clientOrderId;
        } else {
            request['orderId'] = parseInt (id);
        }
        params = this.omit (params, [ 'origClientOrderId' ]);
        const response = await this.privateGetFapiV1Order (this.extend (request, params));
        //
        //     {
        //         "avgPrice": "0.00000",
        //         "clientOrderId": "abc",
        //         "cumQuote": "0",
        //         "executedQty": "0",
        //         "orderId": 1917641,
        //         "origQty": "0.40",
        //         "origType": "TRAILING_STOP_MARKET",
        //         "price": "0",
        //         "reduceOnly": false,
        //         "side": "BUY",
        //         "positionSide": "SHORT",
        //         "status": "NEW",
        //         "stopPrice": "9300",
        //         "closePosition": false,
        //         "symbol": "BTCUSDT",
        //         "time": 1579276756075,
        //         "timeInForce": "GTC",
        //         "type": "TRAILING_STOP_MARKET",
        //         "activatePrice": "9020",
        //         "priceRate": "0.3",
        //         "updateTime": 1579276756075,
        //         "workingType": "CONTRACT_PRICE",
        //         "priceProtect": false
        //     }
        //
        return this.parseOrder (response, market);
    }

    async fetchOpenOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        /**
         * @method
         * @name aster#fetchOpenOrders
         * @description fetch all unfilled currently open orders
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string} symbol unified market symbol
         * @param {int} [since] the earliest time in ms to fetch open orders for
         * @param {int} [limit] the maximum number of open orders structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        await this.loadMarkets ();
        let market = undefined;
        const request = {};
        if (symbol !== undefined) {
            market = this.market (symbol);
            request['symbol'] = market['id'];
        }
        const response = await this.privateGetFapiV1OpenOrders (this.extend (request, params));
        //
        //     [
        //         {
        //             "avgPrice": "0.00000",
        //             "clientOrderId": "abc",
        //             "cumQuote": "0",
        //             "executedQty": "0",
        //             "orderId": 1917641,
        //             "origQty": "0.40",
        //             "origType": "TRAILING_STOP_MARKET",
        //             "price": "0",
        //             "reduceOnly": false,
        //             "side": "BUY",
        //             "positionSide": "SHORT",
        //             "status": "NEW",
        //             "stopPrice": "9300",
        //             "closePosition": false,
        //             "symbol": "BTCUSDT",
        //             "time": 1579276756075,
        //             "timeInForce": "GTC",
        //             "type": "TRAILING_STOP_MARKET",
        //             "activatePrice": "9020",
        //             "priceRate": "0.3",
        //             "updateTime": 1579276756075,
        //             "workingType": "CONTRACT_PRICE",
        //             "priceProtect": false
        //         }
        //     ]
        //
        return this.parseOrders (response, market, since, limit);
    }

    async fetchOrders (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Order[]> {
        /**
         * @method
         * @name aster#fetchOrders
         * @description fetches information on multiple orders made by the user
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string} symbol unified market symbol of the market orders were made in
         * @param {int} [since] the earliest time in ms to fetch orders for
         * @param {int} [limit] the maximum number of order structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {Order[]} a list of [order structures]{@link https://docs.ccxt.com/#/?id=order-structure}
         */
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchOrders() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        if (since !== undefined) {
            request['startTime'] = since;
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.privateGetFapiV1AllOrders (this.extend (request, params));
        //
        //     [
        //         {
        //             "avgPrice": "0.00000",
        //             "clientOrderId": "abc",
        //             "cumQuote": "0",
        //             "executedQty": "0",
        //             "orderId": 1917641,
        //             "origQty": "0.40",
        //             "origType": "TRAILING_STOP_MARKET",
        //             "price": "0",
        //             "reduceOnly": false,
        //             "side": "BUY",
        //             "positionSide": "SHORT",
        //             "status": "NEW",
        //             "stopPrice": "9300",
        //             "closePosition": false,
        //             "symbol": "BTCUSDT",
        //             "time": 1579276756075,
        //             "timeInForce": "GTC",
        //             "type": "TRAILING_STOP_MARKET",
        //             "activatePrice": "9020",
        //             "priceRate": "0.3",
        //             "updateTime": 1579276756075,
        //             "workingType": "CONTRACT_PRICE",
        //             "priceProtect": false
        //         }
        //     ]
        //
        return this.parseOrders (response, market, since, limit);
    }

    parseOrder (order: Dict, market: Market = undefined): Order {
        //
        //     {
        //         "avgPrice": "0.00000",
        //         "clientOrderId": "abc",
        //         "cumQuote": "0",
        //         "executedQty": "0",
        //         "orderId": 1917641,
        //         "origQty": "0.40",
        //         "origType": "TRAILING_STOP_MARKET",
        //         "price": "0",
        //         "reduceOnly": false,
        //         "side": "BUY",
        //         "positionSide": "SHORT",
        //         "status": "NEW",
        //         "stopPrice": "9300",
        //         "closePosition": false,
        //         "symbol": "BTCUSDT",
        //         "time": 1579276756075,
        //         "timeInForce": "GTC",
        //         "type": "TRAILING_STOP_MARKET",
        //         "activatePrice": "9020",
        //         "priceRate": "0.3",
        //         "updateTime": 1579276756075,
        //         "workingType": "CONTRACT_PRICE",
        //         "priceProtect": false
        //     }
        //
        const id = this.safeString (order, 'orderId');
        const clientOrderId = this.safeString (order, 'clientOrderId');
        const timestamp = this.safeInteger (order, 'time');
        const lastTradeTimestamp = this.safeInteger (order, 'updateTime');
        const marketId = this.safeString (order, 'symbol');
        market = this.safeMarket (marketId, market);
        const status = this.parseOrderStatus (this.safeString (order, 'status'));
        const side = this.safeStringLower (order, 'side');
        const type = this.safeStringLower (order, 'type');
        const price = this.safeString (order, 'price');
        const average = this.safeString (order, 'avgPrice');
        const amount = this.safeString (order, 'origQty');
        const filled = this.safeString (order, 'executedQty');
        const cost = this.safeString (order, 'cumQuote');
        const timeInForce = this.safeString (order, 'timeInForce');
        const postOnly = (timeInForce === 'GTX');
        const stopPrice = this.safeNumber (order, 'stopPrice');
        const reduceOnly = this.safeBool (order, 'reduceOnly');
        return this.safeOrder ({
            'info': order,
            'id': id,
            'clientOrderId': clientOrderId,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': lastTradeTimestamp,
            'lastUpdateTimestamp': lastTradeTimestamp,
            'symbol': market['symbol'],
            'type': type,
            'timeInForce': timeInForce,
            'postOnly': postOnly,
            'reduceOnly': reduceOnly,
            'side': side,
            'price': price,
            'stopPrice': stopPrice,
            'triggerPrice': stopPrice,
            'amount': amount,
            'cost': cost,
            'average': average,
            'filled': filled,
            'remaining': undefined,
            'status': status,
            'fee': undefined,
            'trades': undefined,
        }, market);
    }

    parseOrderStatus (status: Str): string {
        const statuses = {
            'NEW': 'open',
            'PARTIALLY_FILLED': 'open',
            'FILLED': 'closed',
            'CANCELED': 'canceled',
            'REJECTED': 'rejected',
            'EXPIRED': 'expired',
        };
        return this.safeString (statuses, status, status);
    }

    async fetchMyTrades (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<Trade[]> {
        /**
         * @method
         * @name aster#fetchMyTrades
         * @description fetch all trades made by the user
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string} symbol unified market symbol
         * @param {int} [since] the earliest time in ms to fetch trades for
         * @param {int} [limit] the maximum number of trades structures to retrieve
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {Trade[]} a list of [trade structures]{@link https://docs.ccxt.com/#/?id=trade-structure}
         */
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchMyTrades() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        if (since !== undefined) {
            request['startTime'] = since;
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.privateGetFapiV1UserTrades (this.extend (request, params));
        //
        //     [
        //         {
        //             "buyer": false,
        //             "commission": "0.00004380",
        //             "commissionAsset": "USDT",
        //             "id": 123456789,
        //             "maker": false,
        //             "orderId": 987654321,
        //             "price": "43795.60",
        //             "qty": "0.001",
        //             "quoteQty": "43.79560",
        //             "realizedPnl": "0",
        //             "side": "BUY",
        //             "positionSide": "BOTH",
        //             "symbol": "BTCUSDT",
        //             "time": 1699999999999
        //         }
        //     ]
        //
        return this.parseTrades (response, market, since, limit);
    }

    async fetchPositions (symbols: Strings = undefined, params = {}): Promise<Position[]> {
        /**
         * @method
         * @name aster#fetchPositions
         * @description fetch all open positions
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string[]|undefined} symbols list of unified market symbols
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [position structure]{@link https://docs.ccxt.com/#/?id=position-structure}
         */
        await this.loadMarkets ();
        const request = {};
        let market = undefined;
        if (symbols !== undefined) {
            const symbol = this.safeValue (symbols, 0);
            if (symbol !== undefined) {
                market = this.market (symbol);
                request['symbol'] = market['id'];
            }
        }
        const response = await this.privateGetFapiV1PositionRisk (this.extend (request, params));
        //
        //     [
        //         {
        //             "entryPrice": "0.00000",
        //             "marginType": "isolated",
        //             "isAutoAddMargin": "false",
        //             "isolatedMargin": "0.00000000",
        //             "leverage": "10",
        //             "liquidationPrice": "0",
        //             "markPrice": "6679.50671178",
        //             "maxNotionalValue": "20000000",
        //             "positionAmt": "0.000",
        //             "symbol": "BTCUSDT",
        //             "unRealizedProfit": "0.00000000",
        //             "positionSide": "BOTH",
        //             "updateTime": 0
        //         }
        //     ]
        //
        const result = [];
        for (let i = 0; i < response.length; i++) {
            const parsed = this.parsePosition (response[i], market);
            result.push (parsed);
        }
        return this.filterByArrayPositions (result, 'symbol', symbols, false);
    }

    parsePosition (position: Dict, market: Market = undefined): Position {
        //
        //     {
        //         "entryPrice": "0.00000",
        //         "marginType": "isolated",
        //         "isAutoAddMargin": "false",
        //         "isolatedMargin": "0.00000000",
        //         "leverage": "10",
        //         "liquidationPrice": "0",
        //         "markPrice": "6679.50671178",
        //         "maxNotionalValue": "20000000",
        //         "positionAmt": "0.000",
        //         "symbol": "BTCUSDT",
        //         "unRealizedProfit": "0.00000000",
        //         "positionSide": "BOTH",
        //         "updateTime": 0
        //     }
        //
        const marketId = this.safeString (position, 'symbol');
        market = this.safeMarket (marketId, market);
        const contracts = this.safeString (position, 'positionAmt');
        const contractSize = this.safeNumber (market, 'contractSize');
        const contractSizeString = this.numberToString (contractSize);
        const unrealizedPnl = this.safeString (position, 'unRealizedProfit');
        const timestamp = this.safeInteger (position, 'updateTime');
        const marginType = this.safeString (position, 'marginType');
        const positionSide = this.safeString (position, 'positionSide');
        let side = undefined;
        if (positionSide === 'BOTH') {
            side = undefined;
        } else if (positionSide === 'LONG') {
            side = 'long';
        } else {
            side = 'short';
        }
        const leverage = this.safeString (position, 'leverage');
        const entryPrice = this.safeString (position, 'entryPrice');
        const markPrice = this.safeString (position, 'markPrice');
        const liquidationPrice = this.safeString (position, 'liquidationPrice');
        const collateral = this.safeString (position, 'isolatedMargin');
        const notional = Precise.stringMul (contracts, contractSizeString);
        const initialMargin = Precise.stringDiv (notional, leverage);
        const percentage = Precise.stringMul (Precise.stringDiv (unrealizedPnl, initialMargin, 4), '100');
        return this.safePosition ({
            'info': position,
            'id': undefined,
            'symbol': market['symbol'],
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'hedged': (positionSide !== 'BOTH'),
            'side': side,
            'contracts': this.parseNumber (contracts),
            'contractSize': contractSize,
            'entryPrice': this.parseNumber (entryPrice),
            'markPrice': this.parseNumber (markPrice),
            'notional': this.parseNumber (notional),
            'leverage': this.parseNumber (leverage),
            'collateral': this.parseNumber (collateral),
            'initialMargin': this.parseNumber (initialMargin),
            'initialMarginPercentage': this.parseNumber (Precise.stringDiv ('1', leverage)),
            'maintenanceMargin': undefined,
            'maintenanceMarginPercentage': undefined,
            'unrealizedPnl': this.parseNumber (unrealizedPnl),
            'liquidationPrice': this.parseNumber (liquidationPrice),
            'marginMode': marginType,
            'percentage': this.parseNumber (percentage),
        });
    }

    async setLeverage (leverage: int, symbol: Str = undefined, params = {}): Promise<any> {
        /**
         * @method
         * @name aster#setLeverage
         * @description set the level of leverage for a market
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {float} leverage the rate of leverage
         * @param {string} symbol unified market symbol
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} response from the exchange
         */
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' setLeverage() requires a symbol argument');
        }
        if ((leverage < 1) || (leverage > 1001)) {
            throw new BadRequest (this.id + ' leverage should be between 1 and 1001');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
            'leverage': leverage,
        };
        return await this.privatePostFapiV1Leverage (this.extend (request, params));
        //
        //     {
        //         "leverage": 21,
        //         "maxNotionalValue": "1000000",
        //         "symbol": "BTCUSDT"
        //     }
        //
    }

    async setMarginMode (marginMode: string, symbol: Str = undefined, params = {}): Promise<any> {
        /**
         * @method
         * @name aster#setMarginMode
         * @description set margin mode to 'cross' or 'isolated'
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string} marginMode 'cross' or 'isolated'
         * @param {string} symbol unified market symbol
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} response from the exchange
         */
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' setMarginMode() requires a symbol argument');
        }
        marginMode = marginMode.toUpperCase ();
        if ((marginMode !== 'ISOLATED') && (marginMode !== 'CROSSED')) {
            throw new BadRequest (this.id + ' setMarginMode() marginMode argument should be isolated or crossed');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
            'marginType': marginMode,
        };
        return await this.privatePostFapiV1MarginType (this.extend (request, params));
        //
        //     {
        //         "code": 200,
        //         "msg": "success"
        //     }
        //
    }

    async setPositionMode (hedged: boolean, symbol: Str = undefined, params = {}): Promise<any> {
        /**
         * @method
         * @name aster#setPositionMode
         * @description set hedged to true or false for a market
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {bool} hedged set to true to enable hedged mode
         * @param {string} symbol unified market symbol
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} response from the exchange
         */
        await this.loadMarkets ();
        const request = {
            'dualSidePosition': hedged ? 'true' : 'false',
        };
        return await this.privatePostFapiV1PositionSideDual (this.extend (request, params));
        //
        //     {
        //         "code": 200,
        //         "msg": "success"
        //     }
        //
    }

    async fetchFundingRate (symbol: string, params = {}): Promise<FundingRate> {
        /**
         * @method
         * @name aster#fetchFundingRate
         * @description fetch the current funding rate
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string} symbol unified market symbol
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a [funding rate structure]{@link https://docs.ccxt.com/#/?id=funding-rate-structure}
         */
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        const response = await this.publicGetFapiV1PremiumIndex (this.extend (request, params));
        //
        //     {
        //         "symbol": "BTCUSDT",
        //         "markPrice": "43795.60000000",
        //         "indexPrice": "43793.24590643",
        //         "estimatedSettlePrice": "43790.11932522",
        //         "lastFundingRate": "0.00010000",
        //         "nextFundingTime": 1699999999999,
        //         "interestRate": "0.00010000",
        //         "time": 1699999999999
        //     }
        //
        return this.parseFundingRate (response, market);
    }

    async fetchFundingRates (symbols: Strings = undefined, params = {}): Promise<FundingRates> {
        /**
         * @method
         * @name aster#fetchFundingRates
         * @description fetch the funding rate for multiple markets
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string[]|undefined} symbols list of unified market symbols
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a dictionary of [funding rates structures]{@link https://docs.ccxt.com/#/?id=funding-rate-structure}, indexe by market symbols
         */
        await this.loadMarkets ();
        const response = await this.publicGetFapiV1PremiumIndex (params);
        //
        //     [
        //         {
        //             "symbol": "BTCUSDT",
        //             "markPrice": "43795.60000000",
        //             "indexPrice": "43793.24590643",
        //             "estimatedSettlePrice": "43790.11932522",
        //             "lastFundingRate": "0.00010000",
        //             "nextFundingTime": 1699999999999,
        //             "interestRate": "0.00010000",
        //             "time": 1699999999999
        //         }
        //     ]
        //
        const result = {};
        for (let i = 0; i < response.length; i++) {
            const entry = response[i];
            const parsed = this.parseFundingRate (entry);
            const symbol = parsed['symbol'];
            result[symbol] = parsed;
        }
        return this.filterByArray (result, 'symbol', symbols);
    }

    async fetchFundingRateHistory (symbol: Str = undefined, since: Int = undefined, limit: Int = undefined, params = {}): Promise<FundingRateHistory[]> {
        /**
         * @method
         * @name aster#fetchFundingRateHistory
         * @description fetches historical funding rate prices
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string} symbol unified symbol of the market to fetch the funding rate history for
         * @param {int} [since] timestamp in ms of the earliest funding rate to fetch
         * @param {int} [limit] the maximum amount of funding rate structures to fetch
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object[]} a list of [funding rate structures]{@link https://docs.ccxt.com/#/?id=funding-rate-history-structure}
         */
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' fetchFundingRateHistory() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
        };
        if (since !== undefined) {
            request['startTime'] = since;
        }
        if (limit !== undefined) {
            request['limit'] = limit;
        }
        const response = await this.publicGetFapiV1FundingRate (this.extend (request, params));
        //
        //     [
        //         {
        //             "symbol": "BTCUSDT",
        //             "fundingTime": 1699999999999,
        //             "fundingRate": "0.00010000"
        //         }
        //     ]
        //
        const rates = [];
        for (let i = 0; i < response.length; i++) {
            const entry = response[i];
            const marketId = this.safeString (entry, 'symbol');
            const symbolInner = this.safeSymbol (marketId, market);
            const timestamp = this.safeInteger (entry, 'fundingTime');
            rates.push ({
                'info': entry,
                'symbol': symbolInner,
                'fundingRate': this.safeNumber (entry, 'fundingRate'),
                'timestamp': timestamp,
                'datetime': this.iso8601 (timestamp),
            });
        }
        const sorted = this.sortBy (rates, 'timestamp');
        return this.filterBySymbolSinceLimit (sorted, symbol, since, limit);
    }

    parseFundingRate (contract: string, market: Market = undefined): FundingRate {
        const fundingRate = contract as any as Dict;
        //
        //     {
        //         "symbol": "BTCUSDT",
        //         "markPrice": "43795.60000000",
        //         "indexPrice": "43793.24590643",
        //         "estimatedSettlePrice": "43790.11932522",
        //         "lastFundingRate": "0.00010000",
        //         "nextFundingTime": 1699999999999,
        //         "interestRate": "0.00010000",
        //         "time": 1699999999999
        //     }
        //
        const marketId = this.safeString (fundingRate, 'symbol');
        const symbol = this.safeSymbol (marketId, market);
        const timestamp = this.safeInteger (fundingRate, 'time');
        const markPrice = this.safeNumber (fundingRate, 'markPrice');
        const indexPrice = this.safeNumber (fundingRate, 'indexPrice');
        const interestRate = this.safeNumber (fundingRate, 'interestRate');
        const fundingRateValue = this.safeNumber (fundingRate, 'lastFundingRate');
        const nextFundingTime = this.safeInteger (fundingRate, 'nextFundingTime');
        return {
            'info': fundingRate,
            'symbol': symbol,
            'markPrice': markPrice,
            'indexPrice': indexPrice,
            'interestRate': interestRate,
            'estimatedSettlePrice': this.safeNumber (fundingRate, 'estimatedSettlePrice'),
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'fundingRate': fundingRateValue,
            'fundingTimestamp': nextFundingTime,
            'fundingDatetime': this.iso8601 (nextFundingTime),
            'nextFundingRate': undefined,
            'nextFundingTimestamp': undefined,
            'nextFundingDatetime': undefined,
            'previousFundingRate': undefined,
            'previousFundingTimestamp': undefined,
            'previousFundingDatetime': undefined,
        };
    }

    async addMargin (symbol: string, amount: number, params = {}): Promise<MarginModification> {
        /**
         * @method
         * @name aster#addMargin
         * @description add margin
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string} symbol unified market symbol
         * @param {float} amount amount of margin to add
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @param {string} [params.positionSide] 'BOTH', 'LONG', or 'SHORT' - required for hedge mode
         * @returns {object} a [margin structure]{@link https://docs.ccxt.com/#/?id=add-margin-structure}
         */
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' addMargin() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
            'amount': this.amountToPrecision (symbol, amount),
            'type': 1, // 1 for add, 2 for reduce
        };
        const positionSide = this.safeString (params, 'positionSide');
        if (positionSide !== undefined) {
            request['positionSide'] = positionSide;
        }
        params = this.omit (params, [ 'positionSide' ]);
        const response = await this.privatePostFapiV1PositionMargin (this.extend (request, params));
        //
        //     {
        //         "code": 200,
        //         "msg": "Successfully modify position margin.",
        //         "type": 1,
        //         "amount": 100.0
        //     }
        //
        return response;
    }

    async reduceMargin (symbol: string, amount: number, params = {}): Promise<MarginModification> {
        /**
         * @method
         * @name aster#reduceMargin
         * @description remove margin from a position
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string} symbol unified market symbol
         * @param {float} amount the amount of margin to remove
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @param {string} [params.positionSide] 'BOTH', 'LONG', or 'SHORT' - required for hedge mode
         * @returns {object} a [margin structure]{@link https://docs.ccxt.com/#/?id=reduce-margin-structure}
         */
        if (symbol === undefined) {
            throw new ArgumentsRequired (this.id + ' reduceMargin() requires a symbol argument');
        }
        await this.loadMarkets ();
        const market = this.market (symbol);
        const request = {
            'symbol': market['id'],
            'amount': this.amountToPrecision (symbol, amount),
            'type': 2, // 1 for add, 2 for reduce
        };
        const positionSide = this.safeString (params, 'positionSide');
        if (positionSide !== undefined) {
            request['positionSide'] = positionSide;
        }
        params = this.omit (params, [ 'positionSide' ]);
        const response = await this.privatePostFapiV1PositionMargin (this.extend (request, params));
        //
        //     {
        //         "code": 200,
        //         "msg": "Successfully modify position margin.",
        //         "type": 2,
        //         "amount": 100.0
        //     }
        //
        return response;
    }

    async fetchLeverageTiers (symbols: Strings = undefined, params = {}): Promise<LeverageTiers> {
        /**
         * @method
         * @name aster#fetchLeverageTiers
         * @description retrieve information on the maximum leverage, for different trade sizes
         * @see https://docs.asterdex.com/product/aster-perpetual-pro/api/api-documentation
         * @param {string[]|undefined} symbols list of unified market symbols
         * @param {object} [params] extra parameters specific to the exchange API endpoint
         * @returns {object} a dictionary of [leverage tiers structures]{@link https://docs.ccxt.com/#/?id=leverage-tiers-structure}, indexed by market symbols
         */
        await this.loadMarkets ();
        const request = {};
        let market = undefined;
        if (symbols !== undefined) {
            const symbol = this.safeValue (symbols, 0);
            if (symbol !== undefined) {
                market = this.market (symbol);
                request['symbol'] = market['id'];
            }
        }
        const response = await this.privateGetFapiV1LeverageBracket (this.extend (request, params));
        //
        //     [
        //         {
        //             "symbol": "BTCUSDT",
        //             "brackets": [
        //                 {
        //                     "bracket": 1,
        //                     "initialLeverage": 125,
        //                     "notionalCap": 50000,
        //                     "notionalFloor": 0,
        //                     "maintMarginRatio": 0.004,
        //                     "cum": 0.0
        //                 }
        //             ]
        //         }
        //     ]
        //
        return this.parseLeverageTiers (response, symbols, 'symbol');
    }

    parseMarketLeverageTiers (info, market: Market = undefined) {
        /**
         * @ignore
         * @method
         * @param {object} info Exchange market response for 1 market
         * @param {object} market CCXT market
         */
        //
        //     {
        //         "symbol": "BTCUSDT",
        //         "brackets": [
        //             {
        //                 "bracket": 1,
        //                 "initialLeverage": 125,
        //                 "notionalCap": 50000,
        //                 "notionalFloor": 0,
        //                 "maintMarginRatio": 0.004,
        //                 "cum": 0.0
        //             }
        //         ]
        //     }
        //
        const brackets = this.safeList (info, 'brackets', []);
        const tiers = [];
        for (let j = 0; j < brackets.length; j++) {
            const bracket = brackets[j];
            tiers.push ({
                'tier': this.safeInteger (bracket, 'bracket'),
                'currency': market['settle'],
                'minNotional': this.safeNumber (bracket, 'notionalFloor'),
                'maxNotional': this.safeNumber (bracket, 'notionalCap'),
                'maintenanceMarginRate': this.safeNumber (bracket, 'maintMarginRatio'),
                'maxLeverage': this.safeNumber (bracket, 'initialLeverage'),
                'info': bracket,
            });
        }
        return tiers;
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        const urls = this.urls as any;
        if (!urls['api'] || !(api in urls['api'])) {
            throw new NotSupported (this.id + ' does not have a URL for ' + api + ' endpoints');
        }
        let url = urls['api'][api];
        url += '/' + path;
        if (api === 'private') {
            this.checkRequiredCredentials ();
            let query = undefined;
            const defaultRecvWindow = this.safeInteger (this.options, 'recvWindow', 5000);
            const extendedParams = this.extend ({
                'timestamp': this.nonce (),
            }, params);
            if (defaultRecvWindow !== undefined) {
                extendedParams['recvWindow'] = defaultRecvWindow;
            }
            const recvWindow = this.safeInteger (params, 'recvWindow');
            if (recvWindow !== undefined) {
                extendedParams['recvWindow'] = recvWindow;
            }
            query = this.urlencode (extendedParams);
            const signature = this.hmac (this.encode (query), this.encode (this.secret), sha256);
            query += '&' + 'signature=' + signature;
            headers = {
                'X-MBX-APIKEY': this.apiKey,
            };
            if ((method === 'GET') || (method === 'DELETE')) {
                url += '?' + query;
            } else {
                body = query;
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
            }
        } else {
            if (Object.keys (params).length) {
                url += '?' + this.urlencode (params);
            }
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    handleErrors (code: int, reason: string, url: string, method: string, headers: Dict, body: string, response, requestHeaders, requestBody) {
        if ((code === 418) || (code === 429)) {
            throw new RateLimitExceeded (this.id + ' ' + code.toString () + ' ' + reason + ' ' + body);
        }
        if (code >= 400) {
            if (body.indexOf ('Price * QTY is zero or less') >= 0) {
                throw new InvalidOrder (this.id + ' order cost = amount * price is zero or less ' + body);
            }
            if (body.indexOf ('LOT_SIZE') >= 0) {
                throw new InvalidOrder (this.id + ' order amount should be evenly divisible by lot size ' + body);
            }
            if (body.indexOf ('PRICE_FILTER') >= 0) {
                throw new InvalidOrder (this.id + ' order price is invalid, i.e. exceeds allowed price precision, exceeds min price or max price limits or is invalid value in general, use this.priceToPrecision (symbol, amount) ' + body);
            }
        }
        if (response === undefined) {
            return undefined;
        }
        const success = this.safeBool (response, 'success', true);
        if (!success) {
            const messageNew = this.safeString (response, 'msg');
            let parsedMessage = undefined;
            if (messageNew !== undefined) {
                try {
                    parsedMessage = JSON.parse (messageNew);
                } catch (e) {
                    parsedMessage = undefined;
                }
                if (parsedMessage !== undefined) {
                    response = parsedMessage;
                }
            }
        }
        const message = this.safeString (response, 'msg');
        const errorCode = this.safeString (response, 'code');
        if (errorCode !== undefined) {
            const feedback = this.id + ' ' + body;
            this.throwExactlyMatchedException (this.exceptions['exact'], errorCode, feedback);
            this.throwBroadlyMatchedException (this.exceptions['broad'], message, feedback);
            throw new ExchangeError (feedback);
        }
        return undefined;
    }
}
