const SecretsManager = require('./secretsManager.js');
const https = require('https');

var qs = require('querystring');


function postRequest(options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, res => {
            let rawData = '';

            res.on('data', chunk => {
                rawData += chunk;
            });

            res.on('end', () => {
                try {
                    resolve(JSON.parse(rawData));
                } catch (err) {
                    console.log('Raw data ;', rawData);
                    reject(new Error(err));
                }
            });
        });

        req.on('error', err => {
            reject(new Error(err));
        });

        // 👇️ write the body to the Request object
        req.write(body);
        req.end();
    });
}

exports.handler = async (event) => {

    var secretName = 'SecretManager';
    var region = 'us-east-2';
    var apiValue = JSON.parse(await SecretsManager.getSecret(secretName, region));
    console.log("SECRETS", apiValue.recurringClientId); 
    
    
    var options_token = {
        hostname: 'cognito.domain.auth.us-east-2.amazoncognito.com',
        path: '/oauth2/token',
        method: 'POST',
        port: 443, // 👈️ replace with 80 for HTTP requests
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic '+ Buffer.from(apiValue.recurringClientId+':'+apiValue.recurringSecretId).toString('base64')
,
            'Accept': '*/*',
            'Cache-Control': 'no-cache'
        },
    };

    var data_token = {
        grant_type: 'client_credentials',
        scope: 'recurringprocess/startemailtask',
    };



    var data_service = {
        from: 'user@example.com',
        to: 'user@example.com',
        cc: 'user@example.com',
        bcc: 'user@example.com',
        subject: 'string',
        body: 'string',
        template: 'string',
        params: {
            property1: 'string',
            property2: 'string',
        }
    };

    try {
        var result = await postRequest(options_token, qs.stringify(data_token));
        console.log('result is: 👉️', result);

        var options_service = {
            hostname: 'k9w1dkc03j.execute-api.us-east-2.amazonaws.com',
            path: '/v1/startemailtask',
            method: 'POST',
            port: 443, // 👈️ replace with 80 for HTTP requests
            headers: {
                'Authorization': result.access_token,
                'Content-Type': 'application/json'
            },
        };

        console.log('options_service', options_service);

        var result_service = await postRequest(options_service, JSON.stringify(data_service));
        console.log('result service is: 👉️', result_service);

        // 👇️️ response structure assume you use proxy integration with API gateway
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result_service),
        };
    } catch (error) {
        console.log('Error is: 👉️', error);
        return {
            statusCode: 400,
            body: error.message,
        };
    }
};
