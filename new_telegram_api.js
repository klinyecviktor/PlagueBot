const TelegramBot = require('node-telegram-bot-api');
const config = require('config');
const vk = require('./lib/workerVK');

/*
 * Notes:
 * One row length - 50 symbols
 */

class PlagueTelegram {
    constructor() {
        this.plagueChatId = config.get('telegram.chatId');
        this.bot = new TelegramBot(config.get('telegram.token'), {polling: true});
        this.commands = {
            help: {
                text: "Shows all the commands"
            },
            vkSearch: {
                text: "Searches for people, who posted photos nearby in VK"
            }
        };

        this.initEvents();
        this.greeting();
    }

    removeListener(regexp) {
        this.bot.textRegexpCallbacks.forEach((item, i, arr) => {
            if (item.regexp.toString() === regexp.toString())
                arr.splice(i, 1);
        })
    }

    initEvents() {
        this.bot.onText(/\/(\w+)/, (msg, regexp) => {
            // console.log(msg, regexp);

            if (msg.from.id != this.plagueChatId)
                this.bot.sendMessage(msg.chat.id, `You don't have enough permissions, ${msg.chat.first_name}!`);
            else this[regexp[1] + 'Command'] && this[regexp[1] + 'Command']();
        })
    }

    greeting() {
        this.bot.sendMessage(this.plagueChatId, "Добро пожаловать, <b>PlagueDoctor</b>!\n/help", {
            parse_mode: "HTML"
        });
    }

    helpCommand() {
        let helpText = "";

        for (let i in this.commands) {
            helpText += "/" + i + " - " + this.commands[i].text + "\n";
        }

        let opts = {
            reply_markup: JSON.stringify(
                {
                    keyboard: [['10'], ['2']],
                    one_time_keyboard: true
                }
            )
        };

        this.bot.sendMessage(this.plagueChatId, helpText);
    }

    vkSearchCommand() {
        let VK = new vk(),
            self = this,
            bot = this.bot,
            text = "Send your location",
            opts = {
                reply_markup: JSON.stringify(
                    {
                        force_reply: true
                    }
                )
            };

        function search(chatId, lat, long, rad) {
            VK.searchGeo(lat, long, rad).then(result => {
                console.log(result);
                if (result.length === 0) {
                    bot.sendMessage(chatId, 'There is no results.\n Repeat search?', {
                        reply_markup: JSON.stringify(
                            {
                                keyboard: [['No'], ['Yes']],
                                one_time_keyboard: true
                            }
                        )
                    });
                    bot.onText(/Yes/, () => {
                        self.removeListener(/Yes/);
                        search(chatId, lat, long, rad);
                    })
                } else
                    result.forEach(item => {
                        bot.sendMessage(chatId, `Photo: <a href="${item.photo_1280}">Zoom</a>\n<a href="vk.com/id${item.owner_id}">Link</a> - VK page`, {
                            parse_mode: 'HTML'
                        })
                    })
            })
        }

        bot.sendMessage(this.plagueChatId, text, opts)
            .then((sended) => {
                let chatId = sended.chat.id,
                    messageId = sended.message_id;

                bot.onReplyToMessage(chatId, messageId, (message) => {
                    if (message.hasOwnProperty('location')) {
                        console.log(message.location);

                        let {latitude, longitude} = message.location;

                        // bot.sendMessage(chatId, 'Choose search zone radius^', {
                        //     reply_markup: JSON.stringify(
                        //         {
                        //             keyboard: [['100 m'], ['800 m']],
                        //             one_time_keyboard: true
                        //         }
                        //     )
                        // });

                        //TODO: CHANGE REGEXP
                        //TODO: ADD TIME CONTROL
                        //TODO: CHECK COUNT (~40)
                        // bot.onText(/800 m/, () => {
                        //     self.removeListener(/800 m/);
                        //     search(chatId, latitude, longitude, 800);
                        // })

                        search(chatId, latitude, longitude);
                    }
                });
            });
    }

}

let bot = new PlagueTelegram(TelegramBot);