// 引入bmob模块
const Bmob = require('./utils/Bmob-2.3.1.min');
import 'umtrack-wx';

// 初始化
// Bmob.initialize(
//     "3a05bec19584e6b743abec92ee73f05a",
//     "3788a09e98cec8d107e503636c74ac0f"
// );
Bmob.initialize(
    "fb3c4d22943eb3d3",
    "2022812"
);

App({
    umengConfig: {
        appKey: '62a6e5db05844627b5ae4b6a', //由友盟分配的APP_KEY
        useOpenid: true, // 是否使用openid进行统计，此项为false时将使用友盟+随机ID进行用户统计。使用openid来统计微信小程序的用户，会使统计的指标更为准确，对系统准确性要求高的应用推荐使用OpenID。
        autoGetOpenid: true, // 是否需要通过友盟后台获取openid，如若需要，请到友盟后台设置appId及secret
        debug: true, //是否打开调试模式
        uploadUserInfo: true // 上传用户信息，上传后可以查看有头像的用户分享信息，同时在查看用户画像时，公域画像的准确性会提升。
    },
    onLaunch() {

        // 登录
        Bmob.User.auth().then(res => {
            console.log('登录成功！')
            let openid = wx.getStorageSync('openid');
            wx.uma.setOpenid(openid);
            // console.log(user)
        }, err => {
            console.log("@111" + err)
            let openid = wx.getStorageSync('openid');
            wx.uma.setOpenid(openid);
        }).catch(err => {
            console.log('@aaaa' + err)
            let openid = wx.getStorageSync('openid');
            wx.uma.setOpenid(openid);
        });

        wx.getSystemInfo({
            success(res) {
                console.log(res)
            }
        });
        // 导入默认模板
        if (!wx.getStorageSync('myTemplate')) {
            let defaultTemplate = [
                { name: '学生检讨', objectId: 'default' },
                { name: '女友道歉', objectId: 'default2' },
                { name: '辞职申请', objectId: 'd174352be2' },
                { name: '个人期末总结', objectId: '7b1dbfbef3' }
            ]
            wx.setStorageSync('myTemplate', defaultTemplate)
        }

        wx.setStorageSync('_signKey', 'KlU3VbDcgguYeyMeUJlDxlMKCGqdSWq1')

    },

})