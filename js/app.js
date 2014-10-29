'use strict';

angular.module('myApp', ['myApp.services', 'myApp.controllers', 'http-auth-interceptor'])
.provider('hostConfig', function () {
    var _host = 'localhost';
    var _port = 80;

    this.setHost = function (newHost) {
        _host = newHost;
    };

    this.setPort = function (newPort) {
        _port = newPort;
    };

    this.$get = function () {
        return {
            getHost: function () {
                return _host;
            },
            getPort: function () {
                return _port;
            }
        };
    };
})
.config(['hostConfigProvider', function (hostConfigProvider) {
    hostConfigProvider.setPort(63321);
}])
.run(['$rootScope', '$injector', 'authService', function ($rootScope, $injector, authService) {
    $injector.get("$http").defaults.transformRequest = function (data, headersGetter) {
        var access_token = authService.getToken();
        if (access_token) headersGetter()['Authorization'] = "Bearer " + access_token;
        if (data) {
            return angular.toJson(data);
        }
        return data;
    };
}]);
