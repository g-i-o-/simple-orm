function pairItemsBy(keyFn) {
    const itemPairer = (listA, listB) => {
        const map = {};
        const pairs = (listA || []).map(item => [item, null]);

        pairs.forEach((pair) => {
            map[keyFn(pair[0])] = pair;
        }, {});

        (listB || []).forEach((item) => {
            const key = keyFn(item);
            if (!map[key]) {
                const pair = [null, null];
                pairs.push(pair);
                map[key] = pair;
            }

            map[key][1] = item;
        });

        return pairs;
    };

    return itemPairer;
}

module.exports = pairItemsBy;
