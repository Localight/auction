angular.module('NonProfitApp', [
        'ngRoute', 'timer'
    ])
    .service('util', function () {
        return {
            endTime: function () {
                // Ends March 31 2014 at midnight
                return (new Date(2014, 2, 31)).getTime();
            }
        }
    })
    .config(function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            })
            .when('/about', {
                templateUrl: 'views/about.html',
                controller: 'AboutCtrl'
            })
            .when('/step1', {
                templateUrl: 'views/step1.html',
                controller: 'Step1Ctrl'
            })
            .when('/step2', {
                templateUrl: 'views/step2.html',
                controller: 'Step2Ctrl'
            })
            .when('/registered', {
                templateUrl: 'views/registered.html'
            })
            .otherwise({
                redirectTo: '/'
            });
    })
    .controller('MainCtrl', function ($scope, $rootScope, util) {
        // if the number of pics are less than 1000, I suggest just write here is better.
        // else loading these data via Back-end API`
        var pics = [
            {src: 'IMG_7722.jpg', title: 'IMG_7722.jpg'},
            {src: 'IMG_7725.jpg', title: 'IMG_7725.jpg'},
            {src: 'IMG_7726.jpg', title: 'IMG_7726.jpg'},
            {src: 'IMG_7727.jpg', title: 'IMG_7727.jpg'},
            {src: 'IMG_7729.jpg', title: 'IMG_7729.jpg'},
            {src: 'IMG_7733.jpg', title: 'IMG_7733.jpg'},
            {src: 'IMG_7734.jpg', title: 'IMG_7734.jpg'},
            {src: 'IMG_7736.jpg', title: 'IMG_7736.jpg'},
            {src: 'IMG_7739.jpg', title: 'IMG_7739.jpg'},
            {src: 'IMG_7740.jpg', title: 'IMG_7740.jpg'},
            {src: 'IMG_7742.jpg', title: 'IMG_7742.jpg'},
            {src: 'IMG_7743.jpg', title: 'IMG_7743.jpg'},
            {src: 'IMG_7745.jpg', title: 'IMG_7745.jpg'},
            {src: 'IMG_7747.jpg', title: 'IMG_7747.jpg'},
            {src: 'IMG_7748.jpg', title: 'IMG_7748.jpg'},
            {src: 'IMG_7749.jpg', title: 'IMG_7749.jpg'},
            {src: 'IMG_7750.jpg', title: 'IMG_7750.jpg'},
            {src: 'IMG_7751.jpg', title: 'IMG_7751.jpg'},
            {src: 'IMG_7753.jpg', title: 'IMG_7753.jpg'},
            {src: 'IMG_7754.jpg', title: 'IMG_7754.jpg'},
            {src: 'IMG_7756.jpg', title: 'IMG_7756.jpg'},
            {src: 'IMG_7758.jpg', title: 'IMG_7758.jpg'},
            {src: 'IMG_7767.jpg', title: 'IMG_7767.jpg'},
            {src: 'IMG_7768.jpg', title: 'IMG_7768.jpg'},
            {src: 'IMG_7769.jpg', title: 'IMG_7769.jpg'},
            {src: 'IMG_7772.jpg', title: 'IMG_7772.jpg'},
            {src: 'IMG_7773.jpg', title: 'IMG_7773.jpg'},
            {src: 'IMG_7774.jpg', title: 'IMG_7774.jpg'},
            {src: 'IMG_7775.jpg', title: 'IMG_7775.jpg'},
            {src: 'IMG_7778.jpg', title: 'IMG_7778.jpg'},
            {src: 'IMG_7779.jpg', title: 'IMG_7779.jpg'},
            {src: 'IMG_7780.jpg', title: 'IMG_7780.jpg'},
            {src: 'IMG_7782.jpg', title: 'IMG_7782.jpg'},
            {src: 'IMG_7783.jpg', title: 'IMG_7783.jpg'},
            {src: 'IMG_7785.jpg', title: 'IMG_7785.jpg'},
            {src: 'IMG_7786.jpg', title: 'IMG_7786.jpg'},
            {src: 'IMG_7788.jpg', title: 'IMG_7788.jpg'},
            {src: 'IMG_7793.jpg', title: 'IMG_7793.jpg'},
            {src: 'IMG_7794.jpg', title: 'IMG_7794.jpg'},
            {src: 'IMG_7795.jpg', title: 'IMG_7795.jpg'},
            {src: 'IMG_7798.jpg', title: 'IMG_7798.jpg'},
            {src: 'IMG_7799.jpg', title: 'IMG_7799.jpg'},
            {src: 'IMG_7802.jpg', title: 'IMG_7802.jpg'},
            {src: 'IMG_7803.jpg', title: 'IMG_7803.jpg'},
            {src: 'IMG_7805.jpg', title: 'IMG_7805.jpg'},
            {src: 'IMG_7811.jpg', title: 'IMG_7811.jpg'},
            {src: 'IMG_7812.jpg', title: 'IMG_7812.jpg'},
            {src: 'IMG_7813.jpg', title: 'IMG_7813.jpg'},
            {src: 'IMG_7814.jpg', title: 'IMG_7814.jpg'},
            {src: 'IMG_7815.jpg', title: 'IMG_7815.jpg'},
            {src: 'IMG_7816.jpg', title: 'IMG_7816.jpg'},
            {src: 'IMG_7819.jpg', title: 'IMG_7819.jpg'},
            {src: 'IMG_7820.jpg', title: 'IMG_7820.jpg'},
            {src: 'IMG_7822.jpg', title: 'IMG_7822.jpg'},
            {src: 'IMG_7823.jpg', title: 'IMG_7823.jpg'},
            {src: 'IMG_7824.jpg', title: 'IMG_7824.jpg'},
            {src: 'IMG_7825.jpg', title: 'IMG_7825.jpg'},
            {src: 'IMG_7826.jpg', title: 'IMG_7826.jpg'},
            {src: 'IMG_7827.jpg', title: 'IMG_7827.jpg'},
            {src: 'IMG_7828.jpg', title: 'IMG_7828.jpg'},
            {src: 'IMG_7830.jpg', title: 'IMG_7830.jpg'},
            {src: 'IMG_7832.jpg', title: 'IMG_7832.jpg'},
            {src: 'IMG_7833.jpg', title: 'IMG_7833.jpg'},
            {src: 'IMG_7835.jpg', title: 'IMG_7835.jpg'},
            {src: 'IMG_7836.jpg', title: 'IMG_7836.jpg'},
            {src: 'IMG_7838.jpg', title: 'IMG_7838.jpg'},
            {src: 'IMG_7839.jpg', title: 'IMG_7839.jpg'},
            {src: 'IMG_7840.jpg', title: 'IMG_7840.jpg'},
            {src: 'IMG_7841.jpg', title: 'IMG_7841.jpg'},
            {src: 'IMG_7842.jpg', title: 'IMG_7842.jpg'},
            {src: 'IMG_7843.jpg', title: 'IMG_7843.jpg'},
            {src: 'IMG_7844.jpg', title: 'IMG_7844.jpg'},
            {src: 'IMG_7845.jpg', title: 'IMG_7845.jpg'},
            {src: 'IMG_7846.jpg', title: 'IMG_7846.jpg'},
            {src: 'IMG_7847.jpg', title: 'IMG_7847.jpg'},
            {src: 'IMG_7848.jpg', title: 'IMG_7848.jpg'},
            {src: 'IMG_7849.jpg', title: 'IMG_7849.jpg'},
            {src: 'IMG_7850.jpg', title: 'IMG_7850.jpg'},
            {src: 'IMG_7851.jpg', title: 'IMG_7851.jpg'},
            {src: 'IMG_7852.jpg', title: 'IMG_7852.jpg'},
            {src: 'IMG_7853.jpg', title: 'IMG_7853.jpg'},
            {src: 'IMG_7855.jpg', title: 'IMG_7855.jpg'},
            {src: 'IMG_7856.jpg', title: 'IMG_7856.jpg'},
            {src: 'IMG_7857.jpg', title: 'IMG_7857.jpg'},
            {src: 'IMG_7859.jpg', title: 'IMG_7859.jpg'},
            {src: 'IMG_7860.jpg', title: 'IMG_7860.jpg'},
            {src: 'IMG_7861.jpg', title: 'IMG_7861.jpg'},
            {src: 'IMG_7862.jpg', title: 'IMG_7862.jpg'},
            {src: 'IMG_7863.jpg', title: 'IMG_7863.jpg'},
            {src: 'IMG_7864.jpg', title: 'IMG_7864.jpg'},
            {src: 'IMG_7866.jpg', title: 'IMG_7866.jpg'},
            {src: 'IMG_7867.jpg', title: 'IMG_7867.jpg'},
            {src: 'IMG_7869.jpg', title: 'IMG_7869.jpg'},
            {src: 'IMG_7871.jpg', title: 'IMG_7871.jpg'},
            {src: 'IMG_7873.jpg', title: 'IMG_7873.jpg'}
        ];
        $scope.picList = [];
        var length = pics.length;
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
        $scope.selectPic = function (pic) {
            $rootScope.selectedPic = pic;
        }
        $scope.endTime = util.endTime();
    })
    .controller('AboutCtrl', function ($scope, util,$window) {
        $(window).scrollTop(0);// go to top when a new page loads
        $scope.endTime = util.endTime();
    })
    .controller('Step1Ctrl',function ($scope, $rootScope, $location) {
        $(window).scrollTop(0);// go to top when a new page loads
        var isCard2Correct = function () {
            return !$scope.form.MM.$pristine && $scope.form.MM.$valid &&
                !$scope.form.YY.$pristine && $scope.form.YY.$valid &&
                !$scope.form.CVV.$pristine && $scope.form.CVV.$valid &&
                !$scope.form.zipCode.$pristine && $scope.form.zipCode.$valid;
        }
        $scope.$watch('model', function () {
            $scope.isCard2Correct = isCard2Correct();
        },true);
        $scope.saveCard = function () {
            $scope.invalid = $scope.form.$invalid;
            $scope.card1Invalid = $scope.form.card1.$pristine || $scope.form.card1.$invalid;
            $scope.card2Invalid = !isCard2Correct();
            if ($scope.form.$valid) {
                // model should be correct data like
                // {amount: 25, card1: "4444555566667777", MM: 2, YY: 16, zipCode: 12345}
                // amount should be more than 15,
                // card1 should be number and length is 16,
                // MM is month, YY is year, CVV's length should be 3 or 4 ,and zipCode's length is 5,
                // all must be reasonable value
                console.log($scope.model);
                $rootScope.model = $scope.model;  // save to global scope if you'd like to use it in other control
                $location.path('/step2');
            }
        }
    }).controller('Step2Ctrl', function ($scope, $rootScope, $location) {
        $(window).scrollTop(0);// go to top when a new page loads
        $scope.$watch('model.email', function () {
            $scope.isEmailCorrect = !$scope.form.email.$pristine && $scope.form.email.$valid;
        });
        $scope.saveUser = function () {
            $scope.invalid = $scope.form.$invalid;
            $scope.nameInvalid = $scope.form.name.$invalid;
            $scope.emailInvalid = $scope.form.email.$invalid;
            if ($scope.form.$valid) {
                // model should be correct data like
                // {name: "Yong", email: "zengjunyong@gmail.com"}
                console.log($scope.model);
                $location.path('/registered');
            }
        }
    });