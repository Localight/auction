angular.module('NonProfitApp', [
        'ngRoute', 'timer'
    ])
    .service('util', function () {
        return {
            endTime: function () {
                // Ends March 30, 2014 at 5 PM (PST)
                return (new Date(2014, 2, 30, 17)).getTime();
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
    .run(function ($rootScope) {
        $rootScope.showMask = true;
    })
    .controller('MainCtrl', function ($scope, $rootScope, util) {
        // make the mask img fill with full screen
        $(function () {
            $('.mask img').width($(window).width());
        })
        		var auction = [];

		auction.name = "Los Alamitos High School";

		auction.items = [
						  {
							"studentName":"Freiert, Jacob ",
							"studentID":16098,
							"classPeriod":1,
							"itemNumber":7722
						  },
						  {
							"studentName":"Garcia, Harrison ",
							"studentID":17016,
							"classPeriod":5,
							"itemNumber":7723
						  },
						  {
							"studentName":"Sasaki, Brandon ",
							"studentID":16613,
							"classPeriod":1,
							"itemNumber":7725
						  },
						  {
							"studentName":"Gomez, Zaira ",
							"studentID":14260,
							"classPeriod":1,
							"itemNumber":7726
						  },
						  {
							"studentName":"Mendoza, Dylan ",
							"studentID":17035,
							"classPeriod":1,
							"itemNumber":7727
						  },
						  {
							"studentName":"Tout, Collin ",
							"studentID":13659,
							"classPeriod":1,
							"itemNumber":7729
						  },
						  {
							"studentName":"Jentes, Korey ",
							"studentID":16914,
							"classPeriod":1,
							"itemNumber":7733
						  },
						  {
							"studentName":"Moynihan, Connor ",
							"studentID":14194,
							"classPeriod":1,
							"itemNumber":7734
						  },
						  {
							"studentName":"Hensley, Jordon ",
							"studentID":17064,
							"classPeriod":1,
							"itemNumber":7736
						  },
						  {
							"studentName":"Lopez, Cash ",
							"studentID":16885,
							"classPeriod":1,
							"itemNumber":7739
						  },
						  {
							"studentName":"Wakamoto, Andrew ",
							"studentID":16653,
							"classPeriod":1,
							"itemNumber":7740
						  },
						  {
							"studentName":"Deal, Luke ",
							"studentID":16792,
							"classPeriod":1,
							"itemNumber":7742
						  },
						  {
							"studentName":"Hamamoto, Jack ",
							"studentID":16626,
							"classPeriod":1,
							"itemNumber":7743
						  },
						  {
							"studentName":"Derry, Caitlin ",
							"studentID":14052,
							"classPeriod":1,
							"itemNumber":7745
						  },
						  {
							"studentName":"Lim, Brandon ",
							"studentID":17341,
							"classPeriod":1,
							"itemNumber":7747
						  },
						  {
							"studentName":"Hollomon, Skylar ",
							"studentID":16966,
							"classPeriod":1,
							"itemNumber":7748
						  },
						  {
							"studentName":"North, Marissa ",
							"studentID":16943,
							"classPeriod":1,
							"itemNumber":7749
						  },
						  {
							"studentName":"Cameron, Lauren ",
							"studentID":17117,
							"classPeriod":1,
							"itemNumber":7750
						  },
						  {
							"studentName":"Ladd, Caitlin ",
							"studentID":16994,
							"classPeriod":1,
							"itemNumber":7751
						  },
						  {
							"studentName":"Pierson, Cade ",
							"studentID":16916,
							"classPeriod":1,
							"itemNumber":7753
						  },
						  {
							"studentName":"Shean, McKenzie ",
							"studentID":17208,
							"classPeriod":1,
							"itemNumber":7754
						  },
						  {
							"studentName":"Lilley, Colleen ",
							"studentID":13684,
							"classPeriod":1,
							"itemNumber":7756
						  },
						  {
							"studentName":"Nguyen,  Christian ",
							"studentID":17451,
							"classPeriod":1,
							"itemNumber":7758
						  },
						  {
							"studentName":"Gutierrez, Richard ",
							"studentID":14776,
							"classPeriod":6,
							"itemNumber":7767
						  },
						  {
							"studentName":"Scoville, Michael ",
							"studentID":15806,
							"classPeriod":6,
							"itemNumber":7768
						  },
						  {
							"studentName":"Ledesma, Eric ",
							"studentID":17068,
							"classPeriod":6,
							"itemNumber":7769
						  },
						  {
							"studentName":"Nguyen, Alex ",
							"studentID":14854,
							"classPeriod":6,
							"itemNumber":7772
						  },
						  {
							"studentName":"Garcia, Raymond ",
							"studentID":14724,
							"classPeriod":6,
							"itemNumber":7773
						  },
						  {
							"studentName":"Sells, Alison ",
							"studentID":16197,
							"classPeriod":6,
							"itemNumber":7774
						  },
						  {
							"studentName":"Bayer, Alison ",
							"studentID":14831,
							"classPeriod":6,
							"itemNumber":7775
						  },
						  {
							"studentName":"Desimone, Ruby ",
							"studentID":15435,
							"classPeriod":6,
							"itemNumber":7778
						  },
						  {
							"studentName":"Reales, Nathaly ",
							"studentID":13711,
							"classPeriod":6,
							"itemNumber":7779
						  },
						  {
							"studentName":"Drake, Christen ",
							"studentID":14011,
							"classPeriod":6,
							"itemNumber":7780
						  },
						  {
							"studentName":"Rowe, Zach",
							"studentID":15244,
							"classPeriod":6,
							"itemNumber":7782
						  },
						  {
							"studentName":"Petersen, Patrick ",
							"studentID":16756,
							"classPeriod":6,
							"itemNumber":7783
						  },
						  {
							"studentName":"Johnson, Hailey ",
							"studentID":17273,
							"classPeriod":6,
							"itemNumber":7785
						  },
						  {
							"studentName":"Tirpak, Jacob",
							"studentID":16925,
							"classPeriod":6,
							"itemNumber":7786
						  },
						  {
							"studentName":"Schwartz, Arnold ",
							"studentID":16529,
							"classPeriod":6,
							"itemNumber":7788
						  },
						  {
							"studentName":"Gascoyne, Julian ",
							"studentID":16476,
							"classPeriod":6,
							"itemNumber":7793
						  },
						  {
							"studentName":"Pukini, Kyle ",
							"studentID":14758,
							"classPeriod":4,
							"itemNumber":7794
						  },
						  {
							"studentName":"Conners, Kara ",
							"studentID":16904,
							"classPeriod":4,
							"itemNumber":7795
						  },
						  {
							"studentName":"Mais, Zachary ",
							"studentID":16995,
							"classPeriod":4,
							"itemNumber":7798
						  },
						  {
							"studentName":"Herron, Mia ",
							"studentID":17093,
							"classPeriod":4,
							"itemNumber":7799
						  },
						  {
							"studentName":"Heintzelman, Andrew ",
							"studentID":17363,
							"classPeriod":4,
							"itemNumber":7800
						  },
						  {
							"studentName":"Allred, Dylan ",
							"studentID":17173,
							"classPeriod":4,
							"itemNumber":7802
						  },
						  {
							"studentName":"Ramos, Andrew ",
							"studentID":17126,
							"classPeriod":4,
							"itemNumber":7803
						  },
						  {
							"studentName":"Bliss, Nicole ",
							"studentID":16546,
							"classPeriod":4,
							"itemNumber":7805
						  },
						  {
							"studentName":"Curtis, Akilah ",
							"studentID":15974,
							"classPeriod":4,
							"itemNumber":7811
						  },
						  {
							"studentName":"Millan, Jacob ",
							"studentID":17125,
							"classPeriod":4,
							"itemNumber":7812
						  },
						  {
							"studentName":"Rockwell, Sasha ",
							"studentID":14074,
							"classPeriod":4,
							"itemNumber":7813
						  },
						  {
							"studentName":"Andersen, Scott ",
							"studentID":15882,
							"classPeriod":4,
							"itemNumber":7814
						  },
						  {
							"studentName":"Brittain, DavstudentID ",
							"studentID":14602,
							"classPeriod":4,
							"itemNumber":7815
						  },
						  {
							"studentName":"Gogley, Liam ",
							"studentID":13916,
							"classPeriod":4,
							"itemNumber":7816
						  },
						  {
							"studentName":"Kusch, Taylor ",
							"studentID":16557,
							"classPeriod":4,
							"itemNumber":7819
						  },
						  {
							"studentName":"Pearson, Emma ",
							"studentID":15202,
							"classPeriod":4,
							"itemNumber":7820
						  },
						  {
							"studentName":"Frankenberg, Mark ",
							"studentID":14054,
							"classPeriod":4,
							"itemNumber":7822
						  },
						  {
							"studentName":"Weinman, Molly ",
							"studentID":16951,
							"classPeriod":4,
							"itemNumber":7823
						  },
						  {
							"studentName":"Banez, Isaac ",
							"studentID":17124,
							"classPeriod":4,
							"itemNumber":7824
						  },
						  {
							"studentName":"Williams, Ian ",
							"studentID":16704,
							"classPeriod":4,
							"itemNumber":7825
						  },
						  {
							"studentName":"ChastudentIDez, Andrew ",
							"studentID":14006,
							"classPeriod":4,
							"itemNumber":7826
						  },
						  {
							"studentName":"Gironda, Daniel ",
							"studentID":17018,
							"classPeriod":4,
							"itemNumber":7827
						  },
						  {
							"studentName":"Eastwood, Carlie ",
							"studentID":13636,
							"classPeriod":4,
							"itemNumber":7828
						  },
						  {
							"studentName":"Ibarra, Brendan",
							"studentID":16856,
							"classPeriod":4,
							"itemNumber":7830
						  },
						  {
							"studentName":"Vengoechea, Christian ",
							"studentID":14578,
							"classPeriod":5,
							"itemNumber":7832
						  },
						  {
							"studentName":"Captain, Andrew ",
							"studentID":13533,
							"classPeriod":1,
							"itemNumber":7833
						  },
						  {
							"studentName":"O'Gorman, Joseph ",
							"studentID":16645,
							"classPeriod":5,
							"itemNumber":7835
						  },
						  {
							"studentName":"Ferguson, Shane ",
							"studentID":16107,
							"classPeriod":6,
							"itemNumber":7836
						  },
						  {
							"studentName":"Snow-Romero, Santana ",
							"studentID":17461,
							"classPeriod":5,
							"itemNumber":7838
						  },
						  {
							"studentName":"Koford, Austin ",
							"studentID":15586,
							"classPeriod":5,
							"itemNumber":7839
						  },
						  {
							"studentName":"Williams, Nick",
							"studentID":14993,
							"classPeriod":5,
							"itemNumber":7840
						  },
						  {
							"studentName":"Hood-Cunningham, Chazz ",
							"studentID":16099,
							"classPeriod":5,
							"itemNumber":7841
						  },
						  {
							"studentName":"Warner, Steven ",
							"studentID":16784,
							"classPeriod":5,
							"itemNumber":7842
						  },
						  {
							"studentName":"DeLaCruz Garcia, Elijah ",
							"studentID":17040,
							"classPeriod":5,
							"itemNumber":7843
						  },
						  {
							"studentName":"Castillo, Gianni ",
							"studentID":14005,
							"classPeriod":5,
							"itemNumber":7844
						  },
						  {
							"studentName":"Graves, Emil ",
							"studentID":14952,
							"classPeriod":5,
							"itemNumber":7845
						  },
						  {
							"studentName":"Meacham, Kody ",
							"studentID":17145,
							"classPeriod":5,
							"itemNumber":7846
						  },
						  {
							"studentName":"Teufel, Lisa ",
							"studentID":17118,
							"classPeriod":5,
							"itemNumber":7847
						  },
						  {
							"studentName":"Biache-Forman, Cheyene ",
							"studentID":16428,
							"classPeriod":6,
							"itemNumber":7848
						  },
						  {
							"studentName":"Yelin, Nicholas ",
							"studentID":17207,
							"classPeriod":1,
							"itemNumber":7849
						  },
						  {
							"studentName":"Buxton, Elizabeth ",
							"studentID":15924,
							"classPeriod":1,
							"itemNumber":7850
						  },
						  {
							"studentName":"Kim, Justin ",
							"studentID":16739,
							"classPeriod":1,
							"itemNumber":7851
						  },
						  {
							"studentName":"Olney, Eric ",
							"studentID":16437,
							"classPeriod":6,
							"itemNumber":7852
						  },
						  {
							"studentName":"Toland, Bradley ",
							"studentID":16460,
							"classPeriod":5,
							"itemNumber":7853
						  },
						  {
							"studentName":"Stevens, Colton ",
							"studentID":16246,
							"classPeriod":5,
							"itemNumber":7855
						  },
						  {
							"studentName":"Barnett, Andy",
							"studentID":15480,
							"classPeriod":1,
							"itemNumber":7856
						  },
						  {
							"studentName":"Rouchon, Alexa",
							"studentID":14846,
							"classPeriod":5,
							"itemNumber":7857
						  },
						  {
							"studentName":"Makiyama, Kimiye ",
							"studentID":16630,
							"classPeriod":1,
							"itemNumber":7859
						  },
						  {
							"studentName":"Platt, Drew",
							"studentID":17334,
							"classPeriod":5,
							"itemNumber":7860
						  },
						  {
							"studentName":"Cortez, Brent ",
							"studentID":17130,
							"classPeriod":5,
							"itemNumber":7861
						  },
						  {
							"studentName":"Nikolau, Pano",
							"studentID":16038,
							"classPeriod":6,
							"itemNumber":7862
						  },
						  {
							"studentName":"Popa, Ana ",
							"studentID":14832,
							"classPeriod":5,
							"itemNumber":7863
						  },
						  {
							"studentName":"Loftus, Aubrianna ",
							"studentID":15391,
							"classPeriod":1,
							"itemNumber":7864
						  },
						  {
							"studentName":"Tripp, Bianca ",
							"studentID":14548,
							"classPeriod":5,
							"itemNumber":7866
						  },
						  {
							"studentName":"Hernandez, Shane ",
							"studentID":14113,
							"classPeriod":1,
							"itemNumber":7867
						  },
						  {
							"studentName":"Bonde, Tiana ",
							"studentID":14004,
							"classPeriod":1,
							"itemNumber":7869
						  },
						  {
							"studentName":"DeMott, Rachael ",
							"studentID":16930,
							"classPeriod":5,
							"itemNumber":7871
						  },
						  {
							"studentName":"Vallejo, Janette ",
							"studentID":17080,
							"classPeriod":5,
							"itemNumber":7873
						  }
						];

		$scope.auction = auction;


        $scope.picList = [];
        var length = auction.items.length;
		var pics = auction.items;
        var i = 0;
        var initCount = 6 * 5; // the number of pictures at the begin
        var step = 6 * 2;   // when need more pictures, the number of pictures
        for (i = 0; i < length && i < initCount; i += 6) {
            var row = [];
            row.push(pics[i]);
            if (i + 1 < length)
                row.push(pics[i + 1]);
            if (i + 2 < length)
                row.push(pics[i + 2]);
            if (i + 3 < length)
                row.push(pics[i + 3]);
            if (i + 4 < length)
                row.push(pics[i + 4]);
            if (i + 5 < length)
                row.push(pics[i + 5]);
            $scope.picList.push(row);
        }
        $scope.selectPic = function (pic) {
            $rootScope.selectedPic = pic;
        }
        // should be execute only once
        setTimeout(function () {
            if($rootScope.showMask){
                $rootScope.showMask = false;
                $scope.$apply();
            }
        }, 3000);
        $scope.endTime = util.endTime();
        setInterval(function () {
            var scrollTop = $(this).scrollTop();
            var scrollHeight = $(document).height();
            var windowHeight = $(this).height();
            $scope.isToBottom = (scrollTop + windowHeight == scrollHeight) && (i < length);
            // if scroll page to bottom, load more pictures
            if ($scope.isToBottom) {
                var j = 0;
                for (; i < length && j < step; i += 6, j += 6) {
                    var row = [];
                    row.push(pics[i]);
                    if (i + 1 < length)
                        row.push(pics[i + 1]);
                    if (i + 2 < length)
                        row.push(pics[i + 2]);
                    if (i + 3 < length)
                        row.push(pics[i + 3]);
                    if (i + 4 < length)
                        row.push(pics[i + 4]);
                    if (i + 5 < length)
                        row.push(pics[i + 5]);
                    $scope.picList.push(row);
                }
            }
            $scope.$apply();
        }, 1000);
    })
    .controller('AboutCtrl', function ($scope, util) {
        $scope.endTime = util.endTime();
    })
    .controller('Step1Ctrl',function ($scope, $rootScope, $location) {
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
