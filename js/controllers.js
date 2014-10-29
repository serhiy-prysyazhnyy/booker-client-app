'use strict';

angular.module('myApp.controllers', ['http-auth-interceptor', 'x-www-form-url-encoder'])


.controller('AppController',
    ['$scope', 'hostConfig', '$filter', '$http', 'formUrlEncoder', 'authService', 'Locations', 'Hotels', 'HotelDetails', 'Booking',
    function ($scope, hostConfig, $filter, $http, formUrlEncoder, authService, Locations, Hotels, HotelDetails, Booking) {

    $scope.Views = {
        LoginForm: 'LoginForm-inline',
        HotelList: 'HotelList-inline',
        HotelDetails: 'HotelDetails-inline',
        BookingList: 'BookingList-inline',
        Cheats: 'Cheats-inline'
    };

    $scope.isCurrentView = function(viewName) {
        return $scope.currentView == viewName;
    };

    $scope.hotelData = {
        currentHotel: null,
        hotelList: [],
        hotelLocation: '',
        sort: 'HotelName',
        direction: '+',
        orderPredicate: '+HotelName'
    };

    $scope.bookingData = {
        newBooking: {},
        bookingList: [],
        sort: 'HotelName',
        direction: '+',
        orderPredicate: '+HotelName'
    };

    $scope.authData = {
        login: '',
        password: '',
        errorDescription: ''
    };

    $scope.signIn = function () {
        $http({
            method: 'POST',
            url: 'http://' + hostConfig.getHost() + ':' + hostConfig.getPort() + '/token',
            transformRequest: formUrlEncoder.transformRequest,
            data: {
                grant_type: 'password',
                username: $scope.authData.login,
                password: $scope.authData.password
            }
        })
        .success(function (data) {
            authService.setToken(data.access_token);
            authService.loginConfirmed();
        })
        .error(function (err) {
            $scope.authData.errorDescription = err.error_description;
        });
    };
        
    $scope.signOut = function () {
        authService.setToken(null);
        $scope.currentView = $scope.Views.LoginForm;
    };

    $scope.loadLocations = function() {
        Locations.query({}, function (data) {
            $scope.hotelData.locationsList = data;
        });
    };

    $scope.showHotels = function() {
        $scope.currentView = $scope.Views.HotelList;
        $scope.setHotelList();
    };
        
    $scope.showBookings = function () {
        $scope.currentView = $scope.Views.BookingList;
        $scope.setBookingList();
    };

    $scope.showCheats = function () {
        $scope.currentView = $scope.Views.Cheats;
    };

    $scope.setHotelList = function () {
        Hotels.query({
            locationId: $scope.hotelData.hotelLocation
        }, function (data) {
            $scope.hotelData.hotelList = data;
        });
    };

    $scope.setBookingList = function () {
        Booking.query({}, function (data) {
            $scope.bookingData.bookingList = data;
        });
    };

    $scope.setSort = function (data, sort) {
        var oldSort = angular.copy($scope[data].sort);
        $scope[data].sort = sort;
        if (oldSort == sort) {
            $scope.setDirection(data, $scope[data].direction == '+' ? '-' : '+');
        } else {
            $scope.setDirection(data, '+');
        }
    };

    $scope.setDirection = function (data, direction) {
        $scope[data].direction = direction;
        $scope[data].orderPredicate = $scope[data].direction + $scope[data].sort;
    };

    $scope.sortClass = function (data, column) {
        return column == $scope[data].sort && 'sort-' + ($scope[data].direction == '+' ? 'desc' : 'asc');
    };

    $scope.setCurrentHotel = function (id) {
        HotelDetails.getHotel({ id: id }, function (data) {
            $scope.hotelData.currentHotel = data;
            $scope.bookingData.newBooking = {};
            $('#datepicker input[name="start"]').val('');
            $('#datepicker input[name="end"]').val('');
            $('#datepicker').datepicker('update');
            $scope.currentView = $scope.Views.HotelDetails;
        });
    };

    $scope.showAll = function () {
        $scope.hotelData.currentHotel = null;
        $scope.currentView = $scope.Views.HotelList;
    };

    $scope.$on('event:auth-loginRequired', function () {
        $scope.currentView = $scope.Views.LoginForm;
    });

    $scope.$on('event:auth-loginConfirmed', function () {
        $scope.authData = {
            login: '',
            password: '',
            errorDescription: ''
        };
        $scope.currentView = $scope.Views.HotelList;
    });

    $scope.getBookingTotal = function () {
        if (!$scope.hotelData.currentHotel || !$scope.bookingData.newBooking)
            return 0;
        
        var roomTypes = $filter('filter')($scope.hotelData.currentHotel.RoomTypes, { Id: $scope.bookingData.newBooking.roomType }, true);
        var cateringTypes = $filter('filter')($scope.hotelData.currentHotel.CateringTypes, { Id: $scope.bookingData.newBooking.cateringType }, true);
        if (roomTypes.length > 0 && cateringTypes.length > 0) {
            return (roomTypes[0].PricePerDay + cateringTypes[0].PricePerDay) * ($scope.bookingData.newBooking.days || 0);
        }
        return 0;
    };
        
    $scope.makeBooking = function () {
        var booking = new Booking({
            roomTypeId: $scope.bookingData.newBooking.roomType,
            cateringTypeId: $scope.bookingData.newBooking.cateringType,
            startDate: $scope.bookingData.newBooking.start,
            endDate: $scope.bookingData.newBooking.end
        });
        
        booking.$save(
            function () {
                $scope.bookingData.errorMessage = null;
                $scope.showBookings();
            },
            function (err) {
                $scope.bookingData.errorMessage = err.data.ExceptionMessage || err.data.Message;
            }
        );
    };

    $scope.deleteBooking = function (id) {
        if (confirm('Do you really want to delete booking?')) {
            Booking.delete({ id: id },
                $scope.showBookings,
                function (err) {
                    $scope.bookingData.deleteErrorMessage = err.data.ExceptionMessage || err.data.Message;
                }
            );
        }
    };

    $scope.deleteBookingCheat = function (id) {
        Booking.delete({ id: id },
            $scope.showBookings,
            function (err) {
                $scope.bookingData.deleteErrorMessage = err.data.ExceptionMessage || err.data.Message;
            }
        );
    };

    $('#datepicker').datepicker({}).on('change', function (evt) {
        var start = $('#datepicker input[name="start"]').val();
        var end = $('#datepicker input[name="end"]').val();
        if (start && end) {
            var startDate = new Date(start);
            var endDate = new Date(end);
            if ($scope.bookingData.newBooking) {
                $scope.bookingData.newBooking.start = start;
                $scope.bookingData.newBooking.end = end;
                $scope.bookingData.newBooking.days = (endDate.getTime() - startDate.getTime()) / 86400000;
                $scope.$apply();
            }
        }
    });

    $scope.loadLocations();
    $scope.showHotels();
}]);
