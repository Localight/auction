module.exports = {
    development: {
        db: {
            uri: 'mongodb://localhost/havenly'
            , opts: {
            }
        }
        , mailgun: {
            apiKey: 'key-212g0rzf7j9z-n9b7zdl797o3bxrsu38'
            , domain: 'https://api.mailgun.net/v2/rs56424.mailgun.org/messages'
            , from: 'auction@TeachArt.org'
        }
    }
    , production: {
        db: {
            uri: 'mongodb://ord-c8-0.objectrocket.com:39020/havenly'
            , opts: {
                user: 'localism'
                , pass: 'H@llF3rr'
            }
        }
        , mailgun: {
            apiKey: 'key-212g0rzf7j9z-n9b7zdl797o3bxrsu38'
            , domain: 'https://api.mailgun.net/v2/rs56424.mailgun.org/messages'
            , from: 'auction@TeachArt.org'
        }
    }
    , redis: {}
    , balancedpayments: 'ak-test-1wFcvF74Jumvpo01Q58Lpmpu8tdD4O3V4'
}
