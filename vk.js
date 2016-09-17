const VKApi = require('node-vkapi');
const config = require('config');
require('./utils/Array');

let VK = new VKApi({
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

// VK.auth.server()
// .then(token => {
//     console.log(token);
// })
// .catch(error => {
//     console.log(error);
// });
VK.auth.user({
    scope: ['audio', 'messages', 'groups', 'photos', 'friends', 'wall', 'offline']
}).then(token => {
    let startTime = new Date();

    startTime.setDate(startTime.getDate() - 1);
    console.log(parseInt(startTime / 1000));

    return VK.call('photos.search', {
        start_time: parseInt(startTime / 1000),
        count: 500,
        radius: 100,
        lat: 50.450742,
        long: 30.457567,
    }).then(res => {
        // wall.post response
        // return 'https://vk.com/wall' + token.user_id + '_' + res.post_id;
        // console.log('search', res);

        let user_ids = res.items
            .map(item => {
                return item.owner_id
            })
            .filter(item => {
                return item > 0
            })
            .getUnique();

        return VK.call('users.get', {
            user_ids: user_ids,
            fields: ['sex', 'bdate', 'can_write_private_message', 'domain', 'relation']
        }).then(result => {
            let filtered = result.filter(item => {
                // console.log(item);

                return item.sex == 1 && item.can_write_private_message == 1 && [2, 3, 4, 7].indexOf(item.relation) == -1;
            });

            console.log(filtered);

            return filtered;
        })

    });
}).then(link => {
    // returned data from previous .then
    console.log('Post was published: ' + link);
}).catch(error => {
    // catching errors
    console.log(error);
});