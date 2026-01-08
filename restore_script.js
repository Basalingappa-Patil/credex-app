const fs = require('fs');
const path = require('path');

const src = 'D:\\credex-old';
const dest = 'd:\\credex';
const logPath = 'd:\\credex\\restore_internal_log.txt';

function log(message) {
    try {
        fs.appendFileSync(logPath, message + '\n');
        // console.log(message);
    } catch (e) { }
}

log(`Starting restore at ${new Date().toISOString()}`);
log(`Checking source: ${src}`);

try {
    if (!fs.existsSync(src)) {
        log(`ERROR: Source folder ${src} does not exist!`);
        try {
            log('Directories in D:\\:');
            const dirs = fs.readdirSync('D:\\').filter(f => {
                try { return fs.statSync('D:\\' + f).isDirectory(); } catch (e) { return false; }
            });
            log(dirs.join(', '));
        } catch (e) { log('Cannot list D:\\: ' + e.message); }
        process.exit(1);
    }

    log('Source exists. Starting copy...');

    function copyDir(source, destination) {
        if (!fs.existsSync(destination)) fs.mkdirSync(destination, { recursive: true });

        const entries = fs.readdirSync(source, { withFileTypes: true });

        for (let entry of entries) {
            const srcPath = path.join(source, entry.name);
            const destPath = path.join(destination, entry.name);

            // Exclusions
            if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.env') {
                continue;
            }

            if (entry.isDirectory()) {
                copyDir(srcPath, destPath);
            } else {
                try {
                    fs.copyFileSync(srcPath, destPath);
                } catch (err) {
                    log(`Failed to copy ${srcPath}: ${err.message}`);
                }
            }
        }
    }

    copyDir(src, dest);
    log('SUCCESS: Copy operation completed.');

} catch (err) {
    log('Fatal error during restore: ' + err.message);
}
