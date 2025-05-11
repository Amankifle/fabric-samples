'use strict';

const stringify = require('json-stringify-deterministic'); // Deterministic JSON.stringify()
const sortKeysRecursive = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {
    // CreateAsset issues a new asset with given details (for inventory managers and supplier)
    async CreateAsset(ctx, id, name, AssetType, quantity, Timestamp, owner, Hash) {
        const role = ctx.clientIdentity.getAttributeValue('role');
        if (role !== 'inventory_managers' && role !== 'supplier') {
            throw new Error('Only inventory managers and supplier can create assets');
        }

        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const asset = {
            ID: id, Name: name, AssetType: AssetType, Quantity: Number(quantity),
            Owner: owner, Timestamp: Timestamp, Hash: Hash, PreviousOwners: [], Status: 'Created', docType: 'product'
        };

        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        await ctx.stub.setEvent('AssetCreated', Buffer.from(JSON.stringify({ ID: id, Owner: owner })));

        return JSON.stringify(asset);
    }

    // Read an asset by ID
    async ReadAsset(ctx, id) {
        const email = ctx.clientIdentity.getAttributeValue('email');
        const assetJSON = await ctx.stub.getState(id);

        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }

        const asset = JSON.parse(assetJSON.toString());

        // Enforce ownership
        if (asset.Owner !== email) {
            throw new Error(`Access denied: you do not own this asset`);
        }

        return JSON.stringify(asset);
    }


    // Check asset existence
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

}

module.exports = AssetTransfer;
