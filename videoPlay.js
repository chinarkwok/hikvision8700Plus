var oWebControl = null;// 插件对象
var bIE = (!!window.ActiveXObject || 'ActiveXObject' in window);// 是否为IE浏览器
var pubKey = '';
var hikIP = "10.16.101.32"; //ip
var hikPort = 80;  //port
var hikAppkey="25471182"; //appkey
var hikSecret="eVHiDVBJ1A3xA8DxB9D8"; //secret
var hikLayout="1x1"; //样式
var initCount = 0;
var cameraIndexCode = ""; //监控点编号
var streamMode = 0;
var transMode = 1;
var gpuMode = 0;


// 视频预览
function startPreview(cameraIndexCodeX) {
    oWebControl.JS_RequestInterface({
        funcName: "startPreview",
        argument: JSON.stringify({
            cameraIndexCode: cameraIndexCodeX,
            streamMode: streamMode,
            transMode: transMode,
            gpuMode: gpuMode
        })
    }).then(function (oData) {
        showCBInfo(JSON.stringify(oData ? oData.responseMsg : ''));
    });
}


    // 获取公钥
    function getPubKey(callback) {
        oWebControl.JS_RequestInterface({
            funcName: "getRSAPubKey",
            argument: JSON.stringify({
                keyLength: 1024
            })
        }).then(function (oData) {
            //console.log(oData)
            if (oData.responseMsg.data) {
                pubKey = oData.responseMsg.data
                callback()
            }
        })
    }
    // 推送消息
    function cbIntegrationCallBack(oData) {
        showCBInfo(JSON.stringify(oData.responseMsg));
    }

    // RSA加密
    function setEncrypt(value) {
        var encrypt = new JSEncrypt();
        encrypt.setPublicKey(pubKey);
        return encrypt.encrypt(value);
    }


    // 初始化插件
    function initPlugin() {
        oWebControl = new WebControl({
            szPluginContainer: "playWnd",
            iServicePortStart: 15900,
            iServicePortEnd: 15909,
            cbConnectSuccess: function () {
                setCallbacks();


                oWebControl.JS_StartService("window", {
                    dllPath: "./VideoPluginConnect.dll"
                    //dllPath: "./DllForTest-Win32.dll"
                }).then(function () {
                    oWebControl.JS_CreateWnd("playWnd", $("#vehicle_camera_window").width(), $("#vehicle_camera_window").height()).then(function () {
                        //console.log("JS_CreateWnd success");
                        initVideo();
                    });
                }, function () {
                    
                });
            },
            cbConnectError: function () {
                //console.log("cbConnectError");
                oWebControl = null;
                $("#playWnd").html("插件未启动，正在尝试启动，请稍候...");
                WebControl.JS_WakeUp("VideoWebPlugin://");
                initCount++;
                if (initCount < 3) {
                    setTimeout(function () {
                        initPlugin();
                    }, 3000)
                } else {
                    $("#playWnd").html("插件启动失败，请检查插件是否安装！");
                }
            },
            cbConnectClose: function () {
                //console.log("cbConnectClose");
                oWebControl = null;
            }
        });
    }
    initPlugin();
    // 设置窗口控制回调
    function setCallbacks() {
        oWebControl.JS_SetWindowControlCallback({
            cbIntegrationCallBack: cbIntegrationCallBack
        });
    }
    
    
    function initVideo() {
        getPubKey(function () {
            oWebControl.JS_RequestInterface({
                funcName: "init",
                argument: JSON.stringify({
                    appkey: hikAppkey,
                    secret: setEncrypt(hikSecret),
                    ip: hikIP,
                    playMode: 0, // 预览
                    port: hikPort,
                    snapDir: "",
                    layout: hikLayout,
                    encryptedFields: 'secret'
                })
            }).then(function (oData) {
                showCBInfo(JSON.stringify(oData ? oData.responseMsg : ''));
            });
        })
    }

    // 显示回调信息
    function showCBInfo(szInfo, type) {
        if (type === 'error') {
            szInfo = "<div style='color: red;'>" + dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss") + " " + szInfo + "</div>";
        } else {
            szInfo = "<div>" + dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss") + " " + szInfo + "</div>";
        }
        $("#cbInfo").html(szInfo + $("#cbInfo").html());
    }
    // 格式化时间
    function dateFormat(oDate, fmt) {
        var o = {
            "M+": oDate.getMonth() + 1, //月份
            "d+": oDate.getDate(), //日
            "h+": oDate.getHours(), //小时
            "m+": oDate.getMinutes(), //分
            "s+": oDate.getSeconds(), //秒
            "q+": Math.floor((oDate.getMonth() + 3) / 3), //季度
            "S": oDate.getMilliseconds()//毫秒
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (oDate.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return fmt;
    }