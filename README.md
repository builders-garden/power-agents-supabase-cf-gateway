# ENS Offchain Resolver Gateway with Supabase - Cloudflare Worker

This package implements a simple CCIP-read gateway worker for ENS offchain resolution, using Supabase as the database for the names.

The work is based on [this example](https://github.com/gskril/ens-offchain-registrar/tree/main) from ENS.

## Usage:

Before running the gateway worker, couple of configuration needs to be done as following:

1. Create a dev.vars in the root directory;
2. Put gateway private key, supabase url and supabase key into it in between double quotes, as below:

```
PRIVATE_KEY=""
SUPABASE_SERVICE_KEY=""
SUPABASE_URL=""
```

3. Run the worker:

```
yarn && yarn build
yarn start
```

## Deployment on Cloudflare

Make sure that all the configuration above has been done. Add the enviroment variables as Cloudflare secrets.
