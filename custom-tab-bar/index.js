// custom-tab-bar/index.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {

    },

    /**
     * 组件的初始数据
     */
    data: {
        active: 0,
        tabBar: {
            color: "#bfbfbf",
            selectedColor: "#30b89c",
            list: [{
                    pagePath: "../index/index",
                    text: "生成",
                },
                {
                    pagePath: "../shop/shop",
                    text: "模板",
                },
                {
                    pagePath: "../tools/tools",
                    text: "工具",
                },
                {
                    pagePath: "../my/my",
                    text: "我的",
                }
            ]
        },
    },

    /**
     * 组件的方法列表
     */
    methods: {
        // 切换tabbar页面
        switchTabBar(e) {
            this.setData({
                active: e.currentTarget.id
            })
            wx.switchTab({
                url: e.currentTarget.dataset.to
            })
        }
    }
})