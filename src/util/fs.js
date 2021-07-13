let fs;

try {
    fs = require('fs/promises')
} catch (fs_promises_error) {
    console.warn('fs/promises unavailable, falling back to pre 15.X fs.promises');

    try {
        fs = require('fs').promises;
    } catch (fs_dot_promises_error) {
        console.warn('fs.promises unavailable.');
    }
}

module.exports = fs;