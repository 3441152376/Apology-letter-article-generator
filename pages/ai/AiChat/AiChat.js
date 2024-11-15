const Bmob = require('../../../utils/Bmob-2.3.1.min');
const md5 = require('md5');
const dayjs = require('dayjs');
let rewardedVideoAd = null;

Page({

    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: '', // 状态栏高度
        bottomInputBoxHeight: 0,
        userRecordObjectId: '',
        inputContent: '',
        inputFocus: false,
        chatList: [],
        chat_id: '',
        deletePopupShow: false,
        editPopupShow: false,
        total_free_usage: 0,
        isCreate: true,
        localSend: false,
        suggests: [{
                title: '再完善一下',
                detail: '能以你生成的文章为基础进一步完善一下吗？',
            },
            {
                title: '换一个立意',
                detail: '请换一个立意再写一篇',
            },
            {
                title: '文章润色',
                detail: '请以你生成的文章为基础进一步润色一下吗，要求使文章读起来有感情，生动形象。',
            }, {
                title: '写一个标题',
                detail: '请帮我以你生成的文章为基础写一个标题',
            }, {
                title: '缩减字数',
                detail: '请你在不改变立意的条件下，精简一下文章字数。',
            }
        ]

    },
    editChat(e) {
        let chatIndex = e.currentTarget.dataset.chatindex;
        let content = encodeURIComponent(this.data.chatList[chatIndex].content);
        wx.navigateTo({
            url: '../../show/show?chatgpt=true&content=' + content
        })
    },
    deleteChat() {
        this.setData({
            deletePopupShow: false
        })
    },
    deleteMessage() {
        let that = this;
        wx.removeStorage({
            key: 'chat' + this.data.chat_id,
            success() {
                wx.showToast({
                    title: '记录清空成功！'
                })
                that.setData({
                    chatList: [],
                    deletePopupShow: false
                })
            }
        })
    },
    deletePopup() {
        this.setData({
            deletePopupShow: !this.data.deletePopupShow
        })
    },
    editPopup() {
        this.setData({
            editPopupShow: !this.data.editPopupShow
        })
    },
    // 判断用户类型
    isVip() {
        let user = wx.getStorageSync('userProperty');
        if (user.senior) {
            return true;
        }
        if (user.expire) {
            let nowtime = dayjs().format('YYYY-MM-DD HH:mm:ss');
            return user.expire > nowtime ? true : false
        }
        return false;
    },
    async send() {

        // 判断授权获取用户信息
        let localUser = wx.getStorageSync('userInfo');
        if (!localUser) {
            // 未授权
            return wx.navigateTo({
                url: '../../login/login'
            });
        }

        if (this.data.inputContent === '') {
            return wx.showToast({ title: '你还没输入内容呀~', icon: 'none' })
        }

        if (this.data.localSend) {
            return wx.showToast({ title: '请勿频繁发送！', icon: 'none' });
        }

        if (this.data.chatList[this.data.chatList.length - 1].content === 'AI正在思考中...') {
            return wx.showToast({
                title: 'Ai正在思考中，稍等一会~',
                icon: 'none'
            })
        }

        // 节流锁
        this.data.localSend = true;

        // 获取用户相关信息
        let updateTime, total_free_usage;
        let userid = JSON.parse(wx.getStorageSync('bmob')).objectId;
        let ToadyBeginTime = dayjs().format('YYYY-MM-DD ') + '00:00:00'
        const query = Bmob.Query("z_iOSGPT");
        query.equalTo("uid", "==", userid);
        let res = await query.find();
        if (res.length) {
            console.log(res.length)
            updateTime = res[0].updatedAt; // 上次更新时间
            total_free_usage = res[0].total_free_usage;
            this.data.userRecordObjectId = res[0].objectId;
            // console.log(res)
            console.log(total_free_usage)
            if (updateTime < ToadyBeginTime) {
                updateTime = ToadyBeginTime;
                total_free_usage = 0;
            }
        } else {
            // 数据库无记录
            updateTime = ToadyBeginTime;
            total_free_usage = 0;
            this.data.isCreate = false;
        }

        this.data.total_free_usage = total_free_usage;

        if (!this.isVip()) {
            // 非会员
            switch (total_free_usage) {
                case 0:
                    // 节流锁
                    this.data.localSend = false;
                    // 提示用户观看广告
                    return wx.showModal({
                        title: '提示',
                        content: '普通用户每天需要观看一个广告免费获得五次对话机会，开通会员可享无广告和更多对话次数。',
                        confirmText: '充值会员',
                        cancelText: '观看广告',
                        success(res) {
                            if (res.confirm) {
                                wx.navigateTo({ url: '../../recharge/recharge' })
                            } else if (res.cancel) {
                                rewardedVideoAd.show()
                                    .then(() => console.log('激励视频 广告显示'));
                            }
                        }
                    });
                    break;
            }
            if (total_free_usage >= 6) {
                // 节流锁
                this.data.localSend = false;
                return wx.showModal({
                    title: '提示',
                    content: '普通用户每天最多有免费五次对话机会，开通会员可享无广告和更多对话次数。',
                    confirmText: '充值会员',
                    cancelText: '取消',
                    success(res) {
                        if (res.confirm) {
                            wx.navigateTo({ url: '../../recharge/recharge' })
                        }
                    }
                });
            }


        } else if (this.isVip()) {
            // 会员
            if (total_free_usage >= 11) {
                let myJtb = await this.getJtb();
                if (myJtb <= 0) {
                    this.data.localSend = false;
                    wx.showToast({ title: '检讨币不足请充值', icon: 'none' })
                        // wx.navigateTo({ url: '../../recharge/recharge' })
                    return 0
                }
            }
        }

        this.sendChat();
    },
    // 获取我的检讨币
    async getJtb() {
        // 获取云端用户信息
        let user = wx.getStorageSync('bmob');
        let userObj = JSON.parse(user)
        const query = Bmob.Query('_User');
        let res = await query.get(userObj.objectId);
        // console.log(res.jtb)
        return res.jtb || 0;
    },
    // 消费检讨币
    async deductJtb(jtb) {
        let nowJtb = await this.getJtb();
        // console.log(nowJtb)
        let newJtb = nowJtb - jtb
        let user = wx.getStorageSync('bmob');
        let userObj = JSON.parse(user)
        const query = Bmob.Query('_User');
        query.set('id', userObj.objectId)
        query.set('jtb', newJtb)
        let res = await query.save();
        // 修改本地记录
        let userProperty = wx.getStorageSync('userProperty');
        userProperty.jtb = newJtb;
        wx.setStorageSync('userProperty', userProperty)
        return res.updatedAt;
    },
    // 发送对话
    sendChat() {
        let _that = this;
        let userid = JSON.parse(wx.getStorageSync('bmob')).objectId;
        let timestamp = Date.now();
        let signKey = wx.getStorageSync('_signKey');
        console.log(signKey)
        let sign = md5(signKey + userid + this.data.chat_id + 'mini' + this.data.inputContent + timestamp);
        let inputContent = this.data.inputContent;
        // 在对话框中追加
        let chatList = this.data.chatList;
        chatList.push({
            type: 'user',
            content: inputContent
        }, {
            type: 'gpt',
            content: 'AI正在思考中...'
        })

        this.setData({
            chatList: chatList,
            inputContent: ''
        })

        // 滚动到底部
        this.pageScrollToBottom();
        wx.request({
            url: 'https://wxxcxpay.egg404.cn/ai/send', //https://wxxcxpay.egg404.cn/ai/send
            method: 'POST',
            timeout: 60000,
            data: {
                content: inputContent,
                userid,
                timestamp,
                chat_id: this.data.chat_id,
                sign,
                type: 'mini'
            },
            async success(res) {
                _that.data.localSend = false;
                if (res.data.code === 400) {
                    chatList[chatList.length - 1].content = res.data.msg;
                    _that.setData({
                        chatList: chatList
                    });
                    return wx.showToast({
                        title: res.data.msg,
                        icon: 'error'
                    })
                }
                if (res.data.code === 401) {
                    chatList[chatList.length - 1].content = res.data.msg;
                    _that.setData({
                        chatList: chatList
                    });
                    return wx.showToast({
                        title: '提问中存在敏感词汇',
                        icon: 'none'
                    })
                }

                if (res.data.code === 200) {
                    // 更新最新对话
                    console.log(chatList[chatList.length - 1])
                    chatList[chatList.length - 1].content = res.data.data.content;

                    _that.setData({
                        chatList: chatList
                    });

                    if (_that.isVip()) {
                        if (_that.data.total_free_usage > 11) {
                            // 扣除检讨币
                            let buyResult = await _that.deductJtb(1);
                            if (!buyResult) {
                                return wx.showToast({ title: '扣除检讨币失败！', icon: 'error' })
                            }
                        }
                    }

                    // 消费次数
                    const query = Bmob.Query('z_iOSGPT');
                    query.get(_that.data.userRecordObjectId).then(res2 => {
                        res2.set("total_free_usage", _that.data.total_free_usage + 1)
                        res2.save().then(res2 => {
                            console.log('次数扣除成功！' + (_that.data.total_free_usage + 1));
                        });
                    })

                    // 本地存储
                    let newChatList = [{
                        type: 'user',
                        content: inputContent
                    }, {
                        type: 'gpt',
                        content: _that.trim(res.data.data.content),
                    }]
                    let localChatList = wx.getStorageSync('chat' + _that.data.chat_id);
                    if (localChatList) {
                        newChatList = [...localChatList, ...newChatList]
                    }

                    wx.setStorageSync('chat' + _that.data.chat_id, newChatList)
                }
                console.log(res)
            },
            fail(err) {
                console.log(err)
                _that.data.localSend = false;
                wx.showToast({
                    title: '当前使用人数过多或者网络不稳定，可能会导致生成时间过长或者失败',
                    icon: 'none'
                })
            }
        })
    },
    pageScrollToBottom: function() {
        wx.createSelectorQuery().select('.chat').boundingClientRect(function(rect) {
            // 使页面滚动到底部
            wx.pageScrollTo({
                scrollTop: rect.height
            })
        }).exec()
    },
    trim(str) {
        while (str.charAt(0) === "\n") {
            str = str.substring(1);
        }
        return str;
    },
    adoptSuggest(e) {
        this.setData({
            inputContent: e.currentTarget.dataset.detail
        })
    },
    back() {
        wx.navigateBack({
            delta: 1,
        })
    },
    inputFocus() {
        this.setData({
            inputFocus: !this.data.inputFocus
        })
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

        let _that = this;
        // 获取状态栏高度
        let res = wx.getSystemInfoSync();
        this.setData({
            statusBarHeight: res.statusBarHeight
        });

        // 获取底部输入盒子高度
        let query0 = wx.createSelectorQuery();
        query0.select('.bottom').boundingClientRect(rect => {
            this.setData({
                bottomInputBoxHeight: rect.height
            });

        }).exec();

        // 读取对话信息
        let chatList = wx.getStorageSync('chat' + options.chat_id);
        if (!chatList) {
            chatList = [{ type: 'gpt', content: '哎呀！本设备的对话记录找不到啦！\n\n但没关系，我依然记得就可以啦~\n你依然可以继续和我进行上次的对话...' }]
        }
        this.setData({
            chatList: chatList,
            chat_id: options.chat_id
        })

        this.pageScrollToBottom();

        let userid = JSON.parse(wx.getStorageSync('bmob')).objectId;

        // 加载激励广告
        if (wx.createRewardedVideoAd) {
            rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId: 'adunit-c2bdea68f1a8535a' })
            rewardedVideoAd.onLoad(() => {
                console.log('onLoad event emit')
            })
            rewardedVideoAd.onError((err) => {
                console.log('onError event emit', err)
            })
            rewardedVideoAd.onClose((resu) => {
                console.log('onClose event emit', resu)
                if (resu && resu.isEnded) {

                    const query = Bmob.Query('z_iOSGPT');
                    if (_that.data.isCreate) {
                        console.log('is ok')
                        query.equalTo("uid", "==", userid);
                        query.get(_that.data.userRecordObjectId).then(res2 => {
                            res2.set("total_free_usage", 1);
                            res2.save();
                            wx.showToast({ title: '奖励已到账！', icon: 'success' })
                        });
                    } else {
                        query.set("uid", userid)
                        query.set("total_free_usage", 1)
                        query.save().then(res2 => {
                            wx.showToast({ title: '奖励已到账！', icon: 'success' })
                        })
                    }

                } else {
                    wx.showToast({ title: '广告被提前关闭', icon: 'error' })
                }
            })
        }

    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    }
})