// pages/my/my.js
const Bmob = require('../../utils/Bmob-2.3.1.min');
const dayjs = require('dayjs');
let rewardedVideoAd = null;

Page({

    /**
     * 页面的初始数据
     */
    data: {
        topic: '',
        worldNumber: 800,
        templateList: [],
        nowTemplateId: "default",
        statusBarHeight: '', // 状态栏高度
        // 输入框获得焦点的样式
        isFocus: {
            topic: '',
            number: ''
        },
        // 显示弹出层
        popupShow: false,
        noticePopupShow: false,
        templateListHeight: '',
        // 批量删除显示
        deleteShow: false,
        // 公告
        notice: ''
    },
    // 公告点我查看
    checkMe() {
        wx.setClipboardData({
            data: this.data.notice,
        })
        this.setData({
            noticePopupShow: false
        })
    },
    awaitMe() {
        wx.showToast({
            title: '好的，等会见啦~',
            icon: 'none'
        })
        wx.removeStorageSync('announcementCount')
        this.setData({
            noticePopupShow: false
        })
    },
    closeNoticPopup() {
        this.setData({
            noticePopupShow: false
        })
    },
    showDelete() {
        this.setData({
            deleteShow: !this.data.deleteShow
        })
    },
    // 删除模板
    deleteTemplate(e) {
        console.log(e)
        let that = this;
        let templateId = e.currentTarget.id;
        wx.showModal({
            title: '模板操作',
            content: '您确定要删除当前模板吗？',
            success(res) {
                if (res.confirm) {
                    if (templateId == 'default' || templateId == 'default2') {
                        return wx.showToast({ title: '无法删除此模板', icon: 'error' })
                    }
                    let myTemplate = wx.getStorageSync('myTemplate');
                    let newMyTemplate = myTemplate.filter(item => {
                        return item.objectId != templateId;
                    })
                    wx.setStorageSync('myTemplate', newMyTemplate);
                    that.setData({
                        templateList: newMyTemplate,
                        nowTemplateId: newMyTemplate[0].objectId
                    })
                } else if (res.cancel) {
                    console.log('用户点击取消')
                }
            }
        })
    },
    getMore() {
        wx.switchTab({
            url: '../shop/shop',
        })
    },
    // 我的模板容器高度
    setMyTemplateListHeight() {
        let that = this;
        var query = wx.createSelectorQuery();
        query.select('.template-list .item').boundingClientRect();
        query.exec(function(res) {
            console.log(res)
            that.setData({
                templateListHeight: ((res[0].height) + 15) * 2 + 'px'
            })
        });
    },
    // 设置弹出层是否显示
    setPopup() {
        this.setData({
            popupShow: !this.data.popupShow
        })
    },
    // 输入框获得焦点时
    inputGetFocus(e) {
        // console.log(e)
        this.data.isFocus[e.target.id] = 'getFocus';
        this.setData({
            isFocus: this.data.isFocus
        })
    },
    // 输入框失去焦点时
    inputLoseFocus(e) {
        this.data.isFocus[e.target.id] = '';
        this.setData({
            isFocus: this.data.isFocus
        })
    },
    // 选择模板操作
    chooseTemplate(e) {
        let that = this;
        let templateId = e.currentTarget.dataset.id;
        // 二次点击删除操作
        if (templateId == this.data.nowTemplateId) {
            wx.showModal({
                title: '模板操作',
                content: '您确定要删除当前模板吗？',
                success(res) {
                    if (res.confirm) {
                        if (templateId == 'default' || templateId == 'default2') {
                            return wx.showToast({ title: '无法删除此模板', icon: 'error' })
                        }
                        let myTemplate = wx.getStorageSync('myTemplate');
                        let newMyTemplate = myTemplate.filter(item => {
                            return item.objectId != templateId;
                        })
                        wx.setStorageSync('myTemplate', newMyTemplate);
                        that.setData({
                            templateList: newMyTemplate,
                            nowTemplateId: newMyTemplate[0].objectId
                        })

                    } else if (res.cancel) {
                        console.log('用户点击取消')
                    }
                }
            })
        }
        // 更新数据重新渲染
        this.setData({
            nowTemplateId: templateId,
            templateList: this.data.templateList
        })
    },
    // 跳转到文章页面
    toArticleShow() {
        if (!this.data.topic) {
            return wx.showToast({
                title: '输入不能为空！',
                icon: 'error'
            })
        }
        var count = wx.getStorageSync('count') || 0;
        // 非vip的激励广告展示
        if (!this.isVip()) {
            // 字数判断
            if (this.data.worldNumber > 2000) {
                return wx.showModal({
                    title: '超出免费文章生成字数',
                    content: '普通用户最多能生成2000字文章，开通会员可享无限字数文章生成权限！',
                    confirmText: '充值会员',
                    cancelText: '取消',
                    success(res) {
                        if (res.confirm) {
                            wx.navigateTo({ url: '../recharge/recharge' })
                        }
                    }
                })
            }
            if (count >= 3) {
                return wx.showModal({
                    title: '获取免费文章生成次数',
                    content: '您的文章生成次数已用完，非会员用户需观看一次激励广告免费获得三次文章生成机会。',
                    confirmText: '观看广告',
                    cancelText: '充值会员',
                    success(res) {
                        if (res.confirm) {
                            rewardedVideoAd.show()
                                .then(() => console.log('激励视频 广告显示'));
                        } else if (res.cancel) {
                            wx.navigateTo({ url: '../recharge/recharge' })
                        }
                    }
                })
            }
        }
        // 信息安全审查
        let topic = this.data.topic;
        let that = this;
        wx.request({
            url: 'https://wxxcxpay.egg404.cn/webapi/sec_check',
            data: {
                content: topic,
                openid: wx.getStorageSync('openid')
            },
            success(res) {
                if (res.data.suggest != 'pass') {
                    return wx.showToast({
                        title: '存在违规内容',
                        icon: 'error'
                    })
                } else {
                    wx.setStorageSync('count', ++count)
                    wx.navigateTo({
                        url: '../show/show?topic=' + that.data.topic + '&templateId=' + that.data.nowTemplateId + '&worldNumber=' + that.data.worldNumber
                    })
                }
            }
        })



    },

    // 判断用户类型
    isVip() {
        let user = JSON.parse(wx.getStorageSync('bmob'));
        if (user.senior) {
            return true;
        }
        if (user.expire) {
            let nowtime = dayjs().format('YYYY-MM-DD HH:mm:ss');
            return user.expire.iso > nowtime ? true : false
        }
        return false;
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {

        // 读取我的模板
        let templateList = wx.getStorageSync('myTemplate');
        this.setData({
            templateList: templateList,
            nowTemplateId: templateList[0].objectId
        })

        // 获取状态栏高度
        let res = wx.getSystemInfoSync();
        this.setData({
            statusBarHeight: res.statusBarHeight + 'px'
        });

        // 加载激励广告
        if (wx.createRewardedVideoAd) {
            rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId: 'adunit-e0279b5646da2956' })
            rewardedVideoAd.onLoad(() => {
                console.log('onLoad event emit')
            })
            rewardedVideoAd.onError((err) => {
                console.log('onError event emit', err)
            })
            rewardedVideoAd.onClose((res) => {
                console.log('onClose event emit', res)
                if (res && res.isEnded) {
                    wx.setStorageSync('count', 0)
                    wx.showToast({ title: '广告观看有效！', icon: 'success' })
                } else {
                    wx.showToast({ title: '广告被提前关闭', icon: 'error' })
                }
            })
        }

        // 读取公告
        this.getAnnouncement();

        // 获取云端用户信息
        let user = wx.getStorageSync('bmob');
        let userObj = JSON.parse(user)
            // Bmob.User.updateStorage(userObj.objectId);
        console.log(userObj)
        const query = Bmob.Query('_User');
        query.get(userObj.objectId).then(res => {
            let jtb = res.jtb || 0;
            let ggb = res.videoAd || 0;
            let senior = res.senior || false;
            let objectId = res.objectId
            let expire = res.hasOwnProperty('expire') ? res.expire.iso : '普通用户';
            // 用户财富
            let userProperty = {
                    jtb,
                    senior,
                    expire,
                    ggb
                }
                // 更新数据
            this.setData({...userProperty, objectId });
            // 更新用户身份
            this.getUserType();
            // 保存到本地
            wx.setStorageSync('userProperty', userProperty)
        }).catch(err => {
            console.log(err)
        })

        // 获取最新的用户财富
        let userProperty = wx.getStorageSync('userProperty');
    },
    // 判断用户类型
    getUserType() {
        if (this.data.senior) {
            var status = '永久会员'
        } else {
            let expire = this.data.expire;
            if (expire == '普通用户') {
                var status = expire
            } else {
                let nowtime = dayjs().format('YYYY-MM-DD HH:mm:ss');
                var status = expire > nowtime ? 'VIP用户' : '普通用户';
            }
        }
        this.setData({
            userType: status
        })
    },

    // 读取公告
    async getAnnouncement() {
        const query = Bmob.Query('AppContent');
        let newCount = await query.count();
        let localAnnouncementCount = wx.getStorageSync('announcementCount') || 0;
        if (newCount > localAnnouncementCount) {
            // 查询第一条数据
            query.order("-createdAt");
            query.limit(1)
            let result = await query.find();
            let res = result[0];
            if (res) {
                wx.setStorageSync('announcementCount', newCount)
                this.setData({
                    notice: res.content,
                    noticePopupShow: true
                })

            }
            console.log(result[0])
        }
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {
        // 设置模板列表容器高度
        this.setMyTemplateListHeight()
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {
        let templateList = wx.getStorageSync('myTemplate');
        this.setData({
            templateList: templateList,
        })

        // 设置tabbar激活项
        if (typeof this.getTabBar === 'function' &&
            this.getTabBar()) {
            this.getTabBar().setData({
                //唯一标识（其它设置不同的整数）  
                active: 0
            })
        }
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {
        this.setData({
            popupShow: false,
            deleteShow: false
        })
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    }
})