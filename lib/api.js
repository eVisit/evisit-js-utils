import { get as getProp, set as setProp, now } from './utils';
import { extend } from './data';

class APIRoute {
	constructor() {

	}

	getCacheObj(_cachePath, _cacheKey) {
		var cachePath = _cachePath,
				cacheKey = _cacheKey;

		if (arguments.length === 1) {
			cacheKey = cachePath;
			cachePath = this.cache;
		} else if (arguments.length === 0) {
			cacheKey = this.cacheKey;
			cachePath = this.cache;
		}

		if (!cachePath)
			return;

		if (!cacheKey)
			return;

		if (cacheKey instanceof Function)
			cacheKey = cacheKey.call(this);

		var apiCache = this.API['_cache'],
				finalCachePath = cachePath + '.' + cacheKey,
				ret = getProp(apiCache, finalCachePath);

		if (ret && (this.cacheInvalid instanceof Function) && this.cacheInvalid.call(this, ret, finalCachePath) === true)
			return;

		return ret;
	}

	function getCache(_cachePath, _cacheKey) {
		var cacheObj = this.getCacheObj.apply(this, arguments);
		return (cacheObj) ? cacheObj.value : undefined;
	}

	function setCache(_cachePath, _cacheKey, _cacheGetter, _data) {
		var cachePath = _cachePath,
				cacheKey = _cacheKey,
				cacheGetter = _cacheGetter,
				data = _data;

		if (arguments.length === 3) {
			data = cacheGetter;
			cacheGetter = this.cacheGetter;
		} else if (arguments.length === 2) {
			data = cacheKey;
			cacheGetter = this.cacheGetter;
			cacheKey = cachePath;
			cachePath = this.cache;
		} else if (arguments.length === 1) {
			data = cachePath;
			cacheGetter = this.cacheGetter;
			cacheKey = this.cacheKey;
			cachePath = this.cache;
		}
		
		if (!cachePath)
			return;

		if (!cacheKey)
			return;

		if (cacheKey instanceof Function)
			cacheKey = cacheKey.call(this, data);

		if (D.utils.instanceOf(cacheGetter, 'string')) {
			var cacheGetterPropKey = cacheGetter;
			cacheGetter = function(data) {
				return getProp(data, cacheGetterPropKey);
			};
		} else if (D.utils.noe(cacheGetter)) {
			cacheGetter = function(data) {
				return data;
			};
		}

		var apiCache = this.API['_cache'],
				finalCachePath = cachePath + '.' + cacheKey,
				currentCache = getProp(apiCache, finalCachePath),
				ret = (D.utils.noe(data)) ? null : cacheGetter.call(this, data, currentCache, finalCachePath, apiCache);

		if (!D.utils.noe(ret)) {
			if (!currentCache) {
				currentCache = {};
				setProp(apiCache, finalCachePath, currentCache);
			}

			currentCache.value = ret;
			currentCache.ts = now();

			if (this.cacheUpdate instanceof Function)
				this.cacheUpdate(ret, currentCache);
		} else {
			setProp(apiCache, finalCachePath, null);
		}

		return ret;
	}

	before() {
	}

	beforeSuccess(data) {
	}

	success() {
	}

	beforeError() {
	}

	error() {
	}

	always() {
	}

	async exec(data) {
		var self = extend(true, Object.create(this), this, {apiArguments: data});

		return new D.Deferred(function(resolve, reject) {
			function handleProcess(func, args) {
				var self = this;
				return new D.Deferred(function(resolve, reject) {
					var ret = func.apply(self, args);
					if (ret instanceof D.Deferred) {
						ret.proxy(this);
					} else {
						if (ret === false) {
							reject(false);
							return;
						}

						if (ret !== undefined)
							resolve.apply(undefined, [ret]);
						else
							resolve();
					}
				}, {immediate: true});
			}

			function onError(err) {
				if (err === false)
					self.cancelled = true;

				doFail.apply(self, arguments);
			}

			function handleError() {
				doFail.apply(self, arguments);
			}

			function doFail() {
				self.setCache(null);

				var args = arguments;
				handleProcess.call(self, self.beforeError, args).always(function() {
					var errorArgs = (arguments.length === 0) ? args : arguments;
					handleProcess.call(self, self.error, errorArgs).always(function() {
						handleProcess.call(self, self.always, errorArgs).always(function() {
							reject.apply(undefined, errorArgs);
						});
					});
				});
			}

			function handleSuccess() {
				var args = arguments;

				handleProcess.call(self, self.beforeSuccess, args).then(function() {
					var beforeSuccessArgs = (arguments.length === 0) ? args : arguments;
					handleProcess.call(self, self.success, beforeSuccessArgs).then(function() {
						var ret, successArgs = (arguments.length === 0) ? beforeSuccessArgs : arguments;
						if (successArgs && successArgs.length > 0)
							ret = self.setCache(successArgs[0]);

						if (ret)
							successArgs[0] = ret;
						
						handleProcess.call(self, self.always, successArgs).always(function() {
							resolve.apply(undefined, successArgs);	
						});
					}, onError);
				}, onError);
			}

			self.resolve = function() {
				resolve.apply(undefined, arguments);
			};

			self.reject = function() {
				reject.apply(undefined, arguments);
			};

			self.require = function() {
				for (var i = 0, il = arguments.length; i < il; i++) {
					var arg = arguments[i];
					if (D.utils.noe(getProp(data, arg)) && D.utils.noe(getProp(self, arg))) {
						var msg = 'Required argument: ' + arg + ', not found';
						console.error(msg);
						throw new Error(msg);
					}
				}
			};

			var cache = self.getCache();
			if (!D.utils.noe(cache)) {
				if (D.utils.instanceOf(cache, 'deferred')) {
					cache.proxy(this);
				} else if (self.force !== true && data.force !== true) {
					resolve(cache);
					return;
				}
			} else {
				//Set cache to pending deferred
				self.setCache(this);
			}	

			handleProcess.call(self, self.before, [data]).then(function() {
				var fakeData = (global.fakeAPIData) ? global.fakeAPIData[self.routeName] : null;

				if (arguments.length > 0) {
					handleSuccess.apply(self, arguments);
				} else if (fakeData) {
					handleSuccess.call(self, fakeData);
				} else {
					$.ajax(D.data.extend(true, {}, self, {
						success: handleSuccess.bind(self),
						error: handleError.bind(self)
					}));
				}
			}, onError);
		}, {immediate: true});
	}
}

class API {
	constructor(routeFactory) {
		Object.defineProperty(this, '_routes', {
			writable: false,
			enumberable: false,
			configurable: false,
			value: {}
		});

		if (routeFactory instanceof Function)
			routeFactory.call(this);
	}

	registerRoute(name, _klass) {
		var ParentKlass = this._routes[name] = _klass;

		this[name] = (data) => {
			class RouteRunner extends ParentKlass {
				constructor(data) {
					extend(true, this, data || {});
				}
			}

			var instance = new RouteRunner(data);
			return instance.exec(data);
		};
	}
};
