const isObject = obj => obj && typeof obj === 'object';

//This was grabbed from a stack overflow question/answer, but I honestly don't remember
//the link to it at this point. It's been a while.
const mergeDeep = (...objects) => {
    return objects.reduce((prev, obj) => {
        Object.keys(obj).forEach(key => {
            const pVal = prev[key];
            const oVal = obj[key];

            if (Array.isArray(pVal) && Array.isArray(oVal)) {
                prev[key] = pVal.concat(...oVal);
            } else if (isObject(pVal) && isObject(oVal)) {
                prev[key] = mergeDeep(pVal, oVal);
            } else {
                prev[key] = oVal;
            }
        });

        return prev;
    }, {});
};

const fetchValueFromObject = (key, def, obj = {}, separator = "=>") => {
    if (typeof key !== 'string') {
        return def;
    }

    return key.split(separator).reduce((current_obj = {}, index) => current_obj[index], obj) || def;
};

/**
 *
 * This fills the object with the value using the keys as the path to aid in building the options object
 *
 * @param key_pieces
 * @param value
 * @param existing_object
 * @returns {*}
 */
const fillObject = (key_pieces, value, existing_object = {}) => {
    const first_key_piece = key_pieces[0];

    if (key_pieces.length === 1) {
        existing_object[first_key_piece.endsWith("[]") ? first_key_piece.slice(0, -2) : first_key_piece] = first_key_piece.endsWith("[]") ? value.split(';') : value;

        return existing_object;
    }

    existing_object[first_key_piece] = fillObject(key_pieces.slice(1), value, existing_object[first_key_piece]);

    return existing_object;
};

module.exports = {isObject, mergeDeep, fetchValueFromObject, fillObject}