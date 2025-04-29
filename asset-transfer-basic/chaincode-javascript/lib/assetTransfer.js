'use strict';

const stringify = require('json-stringify-deterministic'); // Deterministic JSON.stringify()
const sortKeysRecursive = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {
    // CreateAsset issues a new asset with given details (for inventory managers only)
    async CreateAsset(ctx, id, name, description, category, quantity, unitPrice, supplier, warehouseLocation, manufactureDate, expiryDate) {
        const role = ctx.clientIdentity.getAttributeValue('role');
        if (role !== 'user') {
            throw new Error('Only inventory managers can create assets');
        }

        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const asset = {
            ID: id,
            Name: name,
            Description: description,
            Category: category,
            Quantity: Number(quantity),
            UnitPrice: Number(unitPrice),
            Supplier: supplier,
            WarehouseLocation: warehouseLocation,
            ManufactureDate: manufactureDate,
            ExpiryDate: expiryDate,
            docType: 'product'
        };
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    // ReadAsset returns the asset with given ID (any role can read)
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // AssetExists returns true if asset with given ID exists
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

}

module.exports = AssetTransfer;
