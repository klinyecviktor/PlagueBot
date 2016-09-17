const VKApi = require('node-vkapi');
const config = require('config');
require('../utils/Array');

// console.log(config.has('vk.id'));

class Worker {
    constructor() {
        this.VK = new VKApi({
            app: {
                id: config.get('vk.id'),
                secret: config.get('vk.secret'),
            },
            auth: {
                login: config.get('vk.login'),
                pass: config.get('vk.pass'),
                phone: config.get('vk.phone')
            },
            version: '5.40'
        });

        this.authorized = null;
        this.auth();
    }

    auth() {
        this.authorized = this.VK.auth.user({
            scope: ['audio', 'messages', 'groups', 'photos', 'friends', 'wall', 'offline']
        });

        return this.authorized;
    }

    searchGeo(latitude = 50.450742, long = 30.457567, radius = 100){
        return this.authorized.then(token => {
            let startTime = new Date();
            console.log('searchGeo', latitude, long, radius);

            startTime.setDate(startTime.getDate() - 1);
            console.log(parseInt(startTime / 1000));

            return this.VK.call('photos.search', {
                start_time: parseInt(startTime / 1000),
                count: 500,
                radius: radius,
                lat: latitude,
                long: long,
            }).then(res => {
                console.log('photos', res.items.length);
                let user_ids = res.items
                    .map(item => {
                        return item.owner_id
                    })
                    .filter(item => {
                        return item > 0
                    })
                    .getUnique();

                // console.log('photos.search', res, user_ids);


                return this.VK.call('users.get', {
                    user_ids: user_ids,
                    fields: ['sex', 'bdate', 'can_write_private_message', 'domain', 'relation']
                }).then(result => {
                    console.log('users', result.length);

                    let filtered = result.filter(item => {
                        return item.sex == 1 && item.can_write_private_message == 1 && [2, 3, 4, 7].indexOf(item.relation) == -1;
                    });
                    let filteredIDs = filtered.map(item => {
                        return item.id;
                    });
                    let filteredPhotos = res.items.filter(item => {
                        return filteredIDs.indexOf(item.owner_id) > -1;
                    });

                    return filteredPhotos;
                })

            });
        })
    }
}

module.exports = Worker;