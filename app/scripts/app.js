angular.module('NonProfitApp', [
        'ngRoute', 'timer'
    ])
    .directive('smartFloat', function() {
        return {
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl) {
                ctrl.$parsers.unshift(function(viewValue) {
                    var FLOAT_REGEXP = /^\-?\d+((\.|\,)\d+)?$/;
                    if (FLOAT_REGEXP.test(viewValue)&&parseFloat(viewValue.replace(',', '.'))>=15) {
                        ctrl.$setValidity('float', true);
                        return parseFloat(viewValue.replace(',', '.'));
                    } else {
                        ctrl.$setValidity('float', false);
                        return undefined;
                    }
                });
            }
        };
    })
    .config(function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl',
                resolve: {
                    app: function($q, api,$rootScope) {
                        var defer = $q.defer();
                        api.endAuction().then(function (endTime) {
                            $rootScope.endTime = endTime;
                            defer.resolve();
                        });
                        return defer.promise;
                    }
                }
            })
            .when('/about', {
                templateUrl: 'views/about.html',
                controller: 'AboutCtrl',
                resolve: {
                    app: function($q, api,$rootScope) {
                        var defer = $q.defer();
                        api.endAuction().then(function (endTime) {
                            $rootScope.endTime = endTime;
                            defer.resolve();
                        });
                        return defer.promise;
                    }
                }
            })
            .when('/step1', {
                templateUrl: 'views/step1.html',
                controller: 'Step1Ctrl',
                resolve: {
                    app: function($q, api,$rootScope) {
                        var defer = $q.defer();
                        api.endAuction().then(function (endTime) {
                            $rootScope.endTime = endTime;
                            defer.resolve();
                        });
                        return defer.promise;
                    }
                }
            })
            .when('/step2', {
                templateUrl: 'views/step2.html',
                controller: 'Step2Ctrl'
            })
            .when('/step3', {
                templateUrl: 'views/step3.html',
                controller: 'Step1Ctrl',
                resolve: {
                    app: function($q, api,$rootScope) {
                        var defer = $q.defer();
                        api.endAuction().then(function (endTime) {
                            $rootScope.endTime = endTime;
                            defer.resolve();
                        });
                        return defer.promise;
                    }
                }
            })
            .when('/registered', {
                templateUrl: 'views/registered.html',
                controller: 'RegisteredCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });
    })
    .run(function ($rootScope) {
        $rootScope.isCCExist = false;
    })
    .controller('MainCtrl', function ($scope, $rootScope, api) {
        var auction = $scope.auction = [];
        api.getItems()
        .then(function(data){
            auction.items = data;
            auction.items.sort(function (a,b) {
               if(a.timestamp > b.timestamp) return 1;
               if(a.timestamp < b.timestamp) return -1;
               else return 0;
            });
            $scope.picList = [];
            var length = auction.items.length;
            var pics = auction.items;
            var i = 0;
            for (; i < length ; i += 3) {
                var row = [];
                row.push(pics[i]);
                if (i + 1 < length)
                    row.push(pics[i + 1]);
                if (i + 2 < length)
                    row.push(pics[i + 2]);
                $scope.picList.push(row);
            }
        });

        $scope.endTime = $rootScope.endTime;

        $scope.selectPic = function (pic, item) {
            $rootScope.selectedPic = pic;
        }
		$scope.getStudentDisplayName = function (name)
		{
			var nameParts = name.split(",");
			var firstName = nameParts[1];
			var lastName = nameParts[0];
			var lastNameInitial = lastName.substring(0,1);
			var displayName = firstName+" "+lastNameInitial+".";
            return displayName;
        }
    })
    .controller('AboutCtrl', function ($scope, $rootScope) {
        $(window).scrollTop(0);// go to top when a new page loads
        $scope.endTime = $rootScope.endTime;
    })
    .controller('Step1Ctrl',function ($scope, $http, $rootScope, $location,api) {
        $(window).scrollTop(0);// go to top when a new page loads

        $scope.submitting = false;

        var outbid = $location.search();
//        if(outbid.itemNumber){
//            var studentName = 'Jim' // TODO should be get student name via API
//            outbid.studentName = studentName
//            $rootScope.selectedPic = outbid;
//            var model = {amount:outbid.bid};
//            $scope.model = model;
//        }

        var bid = outbid.bid;
        if(bid){
            $http.get('/api/bids/' + bid).success(function (data) {
                data.suggestBid = data.currentHighBid * 1 + 5;
                data.studentName = data.studentFirstname.trim() + ' ' + data.studentLastname.trim().charAt(0);
                $scope.data = data;
                var model = {amount: data.currentHighBid};
                if(data.lastFour){
                    $rootScope.isCCExist = true;
                }
                $scope.model = model;
            });
        }

        $scope.endTime = $rootScope.endTime;

        $scope.readonly = true;
        var isCard2Correct = function () {
//            return !$scope.form.MM.$pristine && $scope.form.MM.$valid &&
//                !$scope.form.YY.$pristine && $scope.form.YY.$valid &&
//                !$scope.form.CVV.$pristine && $scope.form.CVV.$valid &&
//                !$scope.form.zipCode.$pristine && $scope.form.zipCode.$valid;
            return $scope.form.MM.$valid &&
                      $scope.form.YY.$valid &&
                      $scope.form.CVV.$valid &&
                      $scope.form.zipCode.$valid;
        }
        $scope.$watch('model', function () {
            $scope.isCard2Correct = isCard2Correct();
        },true);
        $scope.saveCard = function () {

            $scope.invalid = $scope.form.$invalid;
            $rootScope.isCCExist = $scope.form.$valid;
            $scope.card1Invalid = $scope.form.card1.$pristine || $scope.form.card1.$invalid;
            $scope.card2Invalid = !isCard2Correct();
            if ($scope.form.$valid) {
                $scope.submitting = true;

                // model should be correct data like
                // {amount: 25, card1: "4444555566667777", MM: 2, YY: 16, zipCode: 12345}
                // amount should be more than 15,
                // card1 should be number and length is 16,
                // MM is month, YY is year, CVV's length should be 3 or 4 ,and zipCode's length is 5,
                // all must be reasonable value
                console.log($scope.model);
                $rootScope.model = $scope.model;  // save to global scope if you'd like to use it in other control
			    $rootScope.data = {
                    amount: $scope.model.amount
                    , itemNumber: $rootScope.selectedPic.itemNumber
                    , mm: $scope.model.MM
                    , yy: $scope.model.YY
                    , card: $scope.model.card1
                    , ccv: $scope.model.CVV
			        , zip: $scope.model.zipCode
                    };

                $location.path('/step2');
            }
        }
        $scope.change = function () {
            $scope.readonly = false;
            delete $scope.model.card1;
            delete $scope.model.MM;
            delete $scope.model.YY;
            delete $scope.model.CVV;
            delete $scope.model.zipCode;
        }
		$scope.getStudentDisplayName = function (name)
		{
			var nameParts = name.split(",");
			var firstName = nameParts[1];
			var lastName = nameParts[0];
			var lastNameInitial = lastName.substring(0,1);
			var displayName = firstName+" "+lastNameInitial+".";
            return displayName;
        }
		$scope.createNewCard = function ()
		{
		}
    }).controller('Step2Ctrl', function ($scope, $rootScope, $location, api) {
        $(window).scrollTop(0);// go to top when a new page loads

        $scope.submitting = false;

        $scope.$watch('model.mobile', function () {
            $scope.isMobileCorrect = !$scope.form.mobile.$pristine && $scope.form.mobile.$valid;
        });
        $scope.saveUser = function () {
            $scope.invalid = $scope.form.$invalid;
            $scope.nameInvalid = $scope.form.name.$invalid;
            $scope.emailInvalid = $scope.form.email.$invalid;
            $scope.mobileInvalid = $scope.form.mobile.$invalid;
            if ($scope.form.$valid) {
                $scope.submitting = true;
                // model should be correct data like
                // {name: "Yong", email: "zengjunyong@gmail.com",mobile:"9492026850"}
                // mobile must be digital, and the length is from 10 to 11
                console.log($scope.model);
            }
            $rootScope.data.name = $scope.model.name;
            $rootScope.data.email = $scope.model.email;
            $rootScope.data.phone = $scope.model.mobile;
            console.log($rootScope.data)
            console.log($scope.form.mobile, $scope.model.mobile)
            api.bidOnItem($rootScope.data)
            .then(function(response) {
                console.log('Bid successful:', response);
                $location.path('/registered');
            })
            .catch(function(err){
                console.log('Error with bid: ', err);
                var msg = 'There was a problem with your bid.';
                if(err && err.message) {
                  msg = msg + '\r\n ' + err.message;
                } else if (err && err.data && err.data.message) {
                  msg = '\r\n ' + msg + err.data.message;
                }
                alert (msg);
            });

        }
		$scope.getStudentDisplayName = function (name)
		{
			var nameParts = name.split(",");
			var firstName = nameParts[1];
			var lastName = nameParts[0];
			var lastNameInitial = lastName.substring(0,1);
			var displayName = firstName+" "+lastNameInitial+".";
            return displayName;
        }
    }).controller('RegisteredCtrl', function ($scope, $rootScope, $location) {
        $(window).scrollTop(0);// go to top when a new page loads
    })
    .service('api', function($http,$rootScope) {
        var api = {
            getItems: function() {
                var promise = $http.get('/api/items')
                .then(function(response) {
                    return response.data;
                });
                return promise;
            }
            , bidOnItem: function(data) {
                return $http.post('/api/bids', data)
            }, endAuction: function () {
                var promise = $http.get('/api/auction')
                    .then(function(response) {
                        var data = response.data;
                        var end = data[data.length-1];
                        $rootScope.auctionEndDateText = end.auctionEndDateText;
                        var auctionEndDateYear =  end.auctionEndDateYear;
                        var auctionEndDateMonthNumber = end.auctionEndDateMonthNumber;
                        var auctionEndDateDayNumber = end.auctionEndDateDayNumber;
                        var auctionEndDateHour = end.auctionEndDateHour;
                        var auctionEndDateMinute = end.auctionEndDateMinute;
                        var endTime = (new Date(auctionEndDateYear, auctionEndDateMonthNumber-1, auctionEndDateDayNumber, auctionEndDateHour, auctionEndDateMinute)).getTime();
                        return endTime;
                    });
                return promise;
            }
        };
        return api;
     });
