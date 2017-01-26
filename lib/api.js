import { get as getProp, set as setProp, now, noe, instanceOf } from './utils';
import { extend } from './data';

class APIRoute {
	constructor(opts) {
		extend(this, {
			method: 'GET'
		});

		if (opts)
			extend(true, this, opts);
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

		var apiCache = this.apiBase['_cache'],
				finalCachePath = cachePath + '.' + cacheKey,
				ret = getProp(apiCache, finalCachePath);

		if (ret && (this.cacheInvalid instanceof Function) && this.cacheInvalid.call(this, ret, finalCachePath) === true)
			return;

		return ret;
	}

	getCache(_cachePath, _cacheKey) {
		var cacheObj = this.getCacheObj(...arguments);
		return (cacheObj) ? cacheObj.value : undefined;
	}

	setCache(_cachePath, _cacheKey, _cacheGetter, _data) {
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

		if (instanceOf(cacheGetter, 'string')) {
			var cacheGetterPropKey = cacheGetter;
			cacheGetter = function(data) {
				return getProp(data, cacheGetterPropKey);
			};
		} else if (noe(cacheGetter)) {
			cacheGetter = function(data) {
				return data;
			};
		}

		var apiCache = this.apiBase['_cache'],
				finalCachePath = cachePath + '.' + cacheKey,
				currentCache = getProp(apiCache, finalCachePath),
				ret = (noe(data)) ? null : cacheGetter.call(this, data, currentCache, finalCachePath, apiCache);

		if (!noe(ret)) {
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

	clearCache() {
		var args = new Array();
		for (var i = 0, il = arguments.length; i < il; i++) {
			if (i > 2)
				break;

			args.push(arguments[i]);
		}

		return this.setCache(...args);
	}

	async before() {
	}

	async beforeSuccess(data) {
	}

	async success() {
	}

	async beforeError() {
	}

	async error() {
	}

	async complete() {
	}

	async always() {
	}

	require(data) {
		for (var i = 1, il = arguments.length; i < il; i++) {
			var arg = arguments[i];
			if (noe(getProp(data, arg))) {
				var msg = 'Required argument: ' + arg + ', not found for API route ' + this.routeName;
				throw new Error(msg);
			}
		}
	};

	async exec() {
		async function doOperation() {
			var result, alwaysCalled = false;
			try {
				//Prep query
				result = await this.before();
				if (result === false) {
					//Operation canceled
					return await this.always(false);
				}

				if (result === undefined || result === null) {
					var fakeData = (this.apiBase.fakeData && (fakeData = this.apiBase.fakeData[this.routeName])) ? fakeData : null;
					if (fakeData) {
						//Emulate data
						result = fakeData;
					} else {
						//Run query across network
						result = await this.fetch.call(this, this);
					}
				}

				//Handle success result
				var events = ['beforeSuccess', 'success', 'complete', 'always'];
				for (var i = 0, il = events.length; i < il; i++) {
					let eventName = events[i];

					if (eventName === 'always')
						alwaysCalled = true;

					let newResult = await this[eventName](result);

					if (newResult !== undefined)
						result = newResult;
				}
				
				//Return final result from server
				return result;
			} catch(e) {
				if (alwaysCalled)
					throw e;

				//Handle error result
				var events = ['beforeError', 'error', 'complete', 'always'];
				for (var i = 0, il = events.length; i < il; i++) {
					let eventName = events[i],
							newResult = await this[eventName](result);
					
					if (newResult !== undefined)
						result = newResult;
				}

				var err = new Error(e.message);
				err.result = result;

				throw err;
			}
		}

		if (this.cache && this.force !== true) {
			let cache = this.getCache();
			if (!noe(cache) && cache.value) {
				if (cache.value instanceof Promise)
					return await cache.value;
				
				return cache.value;
			}
		}

		var result = doOperation.call(this);
		
		if (this.cache) {
			this.setCache(result);

			result.then((result) => {
				this.setCache(result);
			}, (err) => {
				this.clearCache();
			});
		}

		return await result;
	}
}

class API {
	constructor(routeFactory, _opts) {
		var opts = _opts || {};

		Object.defineProperty(this, '_routes', {
			writable: false,
			enumberable: false,
			configurable: false,
			value: {}
		});

		if (routeFactory instanceof Function)
			routeFactory.call(this, this.registerRoute.bind(this));
	}

	registerRoute(name, _parent, _builder) {
		var parent = _parent,
				builder = _builder;

		if (arguments.length === 2) {
			builder = parent;
			parent = this.baseRoute();
		} else if (instanceOf(parent, 'string')) {
			parent = this._routes[parent];
		}

		var routeKlass = builder.call(this, parent);
		if (!(routeKlass instanceof Function)) {
			routeKlass = class GenericRoute extends parent {
				constructor() {
					super(...arguments);

					extend(true, this, routeKlass);
				}
			};
		}

		var Klass = this._routes[name] = routeKlass,
				apiBase = this;

		//If route name starts with a capital, it can be used as a parent but can not be called
		if (name.match(/^[A-Z]/))
			return;

		this[name] = async (_opts) => {
			class RouteRunner extends Klass {
				constructor(opts) {
					super(...arguments);

					Object.defineProperty(this, 'routeName', {
						writable: false,
						enumberable: false,
						configurable: false,
						value: name
					});

					Object.defineProperty(this, 'apiBase', {
						writable: false,
						enumberable: false,
						configurable: false,
						value: apiBase
					});

					Object.defineProperty(this, 'fetch', {
						writable: false,
						enumberable: false,
						configurable: false,
						value: apiBase.fetch
					});
				}
			}

			var opts = _opts || {},
					instance = new RouteRunner(opts);

			return await instance.exec();
		};
	}

	async fetch() {
		return {};
	}

	route(name) {
		return this._routes[name];
	}

	baseRoute() {
		return APIRoute;
	}
};

module.exports = {
	APIRoute: APIRoute,
	API: API
}