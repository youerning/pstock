// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'

app = angular.module('pstock', ['ionic',"chart.js","angularMoment"]);
var nowUrl = "http://192.168.31.154/now/?code=";
var detailUrl = "http://192.168.31.154/detail/?code=";
var stockUrl = "http://192.168.31.154/stock/?code=";

// 配置过滤器
app.filter('color', function() {
    return function(chg) {
      if (chg > 0) {
        return "assertive"
      } else {
        return "balanced"
      }
    }
});


// 配置路由
app.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  $ionicConfigProvider.tabs.position('bottom');
  $stateProvider
  .state("home", {
    url:"/home",
    views:{
      "tab-home":{
        controller:"homeCtrl",
        templateUrl: "tpls/home.html"
      }
    }
  });

  $stateProvider
  .state("detail-code", {
    url:"/detail-code/:name",
    views:{
      "tab-user":{
        controller:"detailCodeCtrl",
        templateUrl: "tpls/detail.html"
      }
    }
  });

  $stateProvider
  .state("user", {
    url:"/user",
    views:{
      "tab-user":{
        controller:"userCtrl",
        templateUrl: "tpls/user.html"
      }
    }
  });


  $stateProvider
  .state("backtest", {
    url:"/backtest",
    views:{
      "tab-backtest":{
        controller:"backtestCtrl",
        templateUrl: "tpls/backtest.html"
      }
    }
  });

  $stateProvider
  .state("detail-bt", {
    url:"/detail-bt/:strategy",
    views:{
      "tab-backtest":{
        controller:"detailBtCtrl",
        templateUrl: "tpls/detail-bt.html"
      }
    }
  });

  $urlRouterProvider.otherwise("/home");

});

app.controller("homeCtrl", function($scope, $http, $ionicPopup) {
  // index url http://hq.sinajs.cn/rn=1498643350153&list=s_sh000001,s_sz399001,s_sh000300,s_sz399415,s_sz399006
  var now = Date.parse(new Date()) / 1000;
  var catelog = "stock";
  var urlPrefix = "http://www.toutiao.com/api/article/recent/?source=2&category=" + catelog + 
  "&as=A105177907376A5&cp=5797C7865AD54E1&count=5&offset=0&_="
  // var nextTime = 0;
  $scope.news = [];

  function loadStories(now, callback) {
    var url = urlPrefix + now;
    $http.get(url)
      .success(function (resp) {
        var items = [];
        angular.forEach(resp.data, function(news) {
          // if (!item.thumbnail || story.thumbnail == "self" || story.thumbnail == "default"){
          //     story.thumbnail = "https://www.redditstatic.com/icon.png"
          // }
          items.push(news);
        });

        callback(items);
      })
      .error(function() {
        // console.log("faild")
        faildAlert()
      })
  }

  $scope.loadOlder = function() {
      if ($scope.news.length > 0 ) {
        now = $scope.news[$scope.news.length - 1].behot_time;
      }
      loadStories(now, function(oldNews) {
        $scope.news = $scope.news.concat(oldNews);
        $scope.$broadcast("scroll.infiniteScrollComplete");
      });
  };

  $scope.loadNewer = function() {
      now = $scope.news[0].behot_time
      loadStories(now, function(newNews) {
        $scope.news = newNews.concat($scope.news);
        $scope.$broadcast("scroll.refreshComplete");
      });
  };

  faildAlert = function() {
   var alertPopup = $ionicPopup.alert({
     title: "Search Faild",
     template: keyword + " not in reddit"
    })
  };

  $scope.openLink = function (url) {
    window.open(url, "_blank");
  };

});

app.controller("userCtrl", function($scope, $http, $ionicPopup, $timeout) {
    $scope.data = {};

    $scope.userCode = angular.fromJson(window.localStorage["userCode"] || "{}");
    refresh();

    function persist() {
      window.localStorage["userCode"] = angular.toJson($scope.userCode)
    };

    $scope.userAdd = function() {
     $scope.tmp = [];
     // An elaborate, custom popup
     var myPopup = $ionicPopup.show({
     template: '<input ng-model="tmp.newC">{{newC}}',
     title: '添加股票代码',
     subTitle: '',
     scope: $scope,
     buttons: [
       { text: '取消' },
       {
         text: '<b>添加</b>',
         type: 'button-positive',
         onTap: function(e) {
          if (!$scope.tmp.newC) {
           e.preventDefault();
           console.log($scope.tmp.newC);
          } else {
           $scope.userCode[$scope.tmp.newC] = true;
           // console.log($scope.userCode);
          }
         }
       },
     ]
     });

     myPopup.then(function(res) {
       console.log($scope.userCode);
       persist();
       refresh();
      });
  };

  function refresh() {
    angular.forEach($scope.userCode, function(key, code) {
      var url = nowUrl + code;
      $http.get(url)
      .success(function (resp) {
        $scope.data[resp.data.code["0"]] = resp.data
      })
      .error(function() {
        console.log("faild")
        // faildAlert()
      })
    })
  };
});

app.controller("detailCodeCtrl", function($scope, $http, $state) {
  $scope.name = $state.params.name;
  var surl = stockUrl + $scope.name;

  $http.get(surl)
  .success(function(resp) {
    $scope.labelsline = Object.values(resp.data.date);
    $scope.seriesline = ["ma5", "ma10", "ma20", "close"];
    $scope.dataline = [
      Object.values(resp.data.ma5),
      Object.values(resp.data.ma10),
      Object.values(resp.data.ma20),
      Object.values(resp.data.close)];
    $scope.optionsline = {
      title: {
        display:true,
        text: "趋势图"
      },
      elements: {
        point:{
          radius: 0
          }
      },
      xAxis: {
        display:true,
        axisLabel: 'X Axis',
        rotateLabels: 90
       }
    };

    $scope.labelsbar = Object.values(resp.data.date);
    $scope.seriesbar = ["volume"];
    $scope.databar = [
      Object.values(resp.data.volume)];
    $scope.optionsbar = {
      title: {
        display:true,
        text: "成交量"
      }
    };

  });

  var durl = detailUrl + $scope.name;
  $http.get(durl)
  .success(function(resp) {
    $scope.detail = resp.data;
  });

});


app.controller("backtestCtrl", function($scope,$http) {
  var data = [
        {
          strategy: "策略一",
          id:1,
          cash:10000,
          name:"青海春天",
          code: "SH600381",
          price: 12.38,
          change:0.32
        },
        {
          strategy: "策略二",
          id:2,
          cash:5000,
          name:"格力电器",
          code: "SZ000651",
          price: 41.43,
          change: 1.84
        },
        {

          strategy: "策略三",
          id:3,
          cash:60000,
          name:"平安银行",
          code: "SH600001",
          price: 9.36,
          change:0.65
        },
        {
          strategy: "策略四",
          id:4,
          cash:90000,
          name:"长航凤凰",
          code: "SH000520",
          price: 5.90,
          change:-0.51
        }
    ]

    $scope.data = data;
});

app.controller("detailBtCtrl", function($scope, $http, $state) {
  $scope.strategy = $state.params.strategy;
  $scope.labels = ["January", "February", "March", "April", "May", "June", "July"];
  $scope.series = ['Series A', 'Series B'];
  $scope.data = [
    [65, 59, 80, 81, 56, 55, 40],
    [28, 48, 40, 19, 86, 27, 90]
  ];
  $scope.onClick = function (points, evt) {
    console.log(points, evt);
  };
  $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }, { yAxisID: 'y-axis-2' }];
  $scope.options = {
    scales: {
      yAxes: [
        {
          id: 'y-axis-1',
          type: 'linear',
          display: true,
          position: 'left'
        },
        {
          id: 'y-axis-2',
          type: 'linear',
          display: true,
          position: 'right'
        }
      ]
    }
  };
});


app.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }

    if (window.cordova && window.cordova.InAppBrowser) {
      window.open = window.cordova.InAppBrowser.open;
    }

    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})
