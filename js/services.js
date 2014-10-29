'use strict';

angular.module('myApp.services', ['ngResource'])
.factory('Locations', ['$resource', 'hostConfig', function ($resource, hostConfig) {
    return $resource('http://' + hostConfig.getHost() + ':port/api/Locations/:id',
        { port: ':' + hostConfig.getPort(), id: '@id' }
    );
}])
.factory('Hotels', ['$resource', 'hostConfig', function ($resource, hostConfig) {
    return $resource('http://' + hostConfig.getHost() + ':port/api/Hotels/:id',
        { port: ':' + hostConfig.getPort(), id: '@id' }
    );
}])
.factory('HotelDetails', ['$resource', 'hostConfig', function ($resource, hostConfig) {
    return $resource('http://' + hostConfig.getHost() + ':port/api/HotelDetails/:id',
        { port: ':' + hostConfig.getPort(), id: '@id' },
        { getHotel: { method: 'GET', params: { port: ':' + hostConfig.getPort(), id: 0 } } }
    );
}])
.factory('Booking', ['$resource', 'hostConfig', function ($resource, hostConfig) {
    return $resource('http://' + hostConfig.getHost() + ':port/api/Booking/:id',
        { port: ':' + hostConfig.getPort(), id: '@id' }
    );
}])
.value('version', '0.1');

/*
{ 'get':    {method:'GET'},
  'save':   {method:'POST'},
  'query':  {method:'GET', isArray:true},
  'remove': {method:'DELETE'},
  'delete': {method:'DELETE'} };
*/