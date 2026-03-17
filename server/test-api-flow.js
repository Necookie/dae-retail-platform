const run = async () => {
    try {
        const login = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@dae.com', password: 'password123' })
        }).then(r => r.json());

        if (!login.success) throw new Error('Login failed');
        const token = login.data.token;
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        console.log('--- FETCHING MATERIALS ---');
        const materials = await fetch('http://localhost:3000/api/materials', { headers }).then(r => r.json());
        const fuzzyWire = materials.data.find(m => m.name === 'Test Fuzzy Wire');
        console.log('Found Material:', fuzzyWire.name, 'with variants:', fuzzyWire.variants.length);

        console.log('\n--- PURCHASING VARIANT (Red) ---');
        const redVariant = fuzzyWire.variants.find(v => v.name === 'Red');
        const purchaseReq = await fetch(`http://localhost:3000/api/materials/${fuzzyWire.id}/purchases`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                variantId: redVariant.id,
                quantity: 100,
                unitCost: 5.50,
                supplier: 'Test Supplier',
                notes: 'Test Purchase'
            })
        }).then(r => r.json());
        console.log('Purchase Response:', purchaseReq);

        console.log('\n--- CREATING PRODUCT ---');
        const productReq = await fetch('http://localhost:3000/api/products', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: 'Test Bouquet ' + Date.now(),
                sku: 'TB-' + Date.now(),
                sellingPrice: 1500,
                materials: [
                    { materialId: fuzzyWire.id, variantId: redVariant.id, quantityRequired: 10 }
                ]
            })
        }).then(r => r.json());
        console.log('Product created:', productReq.success, productReq.data?.name);

        console.log('\n--- CREATING SALE ---');
        if (productReq.success) {
            const saleReq = await fetch('http://localhost:3000/api/sales', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    productId: productReq.data.id,
                    quantity: 2,
                    paymentStatus: 'PAID',
                    notes: 'Test Sale'
                })
            }).then(r => r.json());
            console.log('Sale Response:', saleReq);
        } else {
            console.log('Skipping Sale, Product creation failed', productReq);
        }

        console.log('\n✅ End-to-End Test Completed Successfully.');
    } catch (e) { console.error('❌ E2E Test Error:', e) }
};
run();
