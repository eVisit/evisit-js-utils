import { get as getProp, set as setProp, now, noe, instanceOf } from './utils';
import { extend } from './data';

class APIRoute {
	constructor(opts, routeName, apiBase) {
		Object.defineProperty(this, 'routeName', {
			writable: false,
			enumberable: false,
			configurable: false,
			value: routeName
		});

		Object.defineProperty(this, 'apiBase', {
			writable: false,
			enumberable: false,
			configurable: false,
			value: apiBase
		});

		extend(this, {
			method: 'GET'
		});

		if (opts)
			extend(true, this, opts);
	}

	async getCacheObj(_cachePath, _cacheKey) {
		if (!this.apiBase.cacheEngine)
			return;

		var cacheEngine = this.apiBase.cacheEngine,
				cachePath = _cachePath,
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

		var finalCachePath = cachePath + '.' + cacheKey,
				ret = await cacheEngine.get(finalCachePath);

		if (ret && (this.cacheInvalid instanceof Function)) {
			var isInvalid = await this.cacheInvalid.call(this, ret, finalCachePath, cacheEngine);
			if (isInvalid)
				return;
		}

		return ret;
	}

	async getCache(_cachePath, _cacheKey) {
		var cacheObj = this.getCacheObj(...arguments);
		return (cacheObj) ? cacheObj.value : undefined;
	}

	async setCache(_cachePath, _cacheKey, _cacheGetter, _data) {
		if (!this.apiBase.cacheEngine)
			return;

		var cacheEngine = this.apiBase.cacheEngine,
				cachePath = _cachePath,
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

		var finalCachePath = cachePath + '.' + cacheKey,
				currentCache = await cacheEngine.get(finalCachePath),
				ret = (noe(data)) ? null : cacheGetter.call(this, data, currentCache, finalCachePath, cacheEngine);

		if (!noe(ret)) {
			if (!currentCache)
				currentCache = {};

			currentCache.value = ret;
			currentCache.ts = now();

			if (this.cacheUpdate instanceof Function)
				await this.cacheUpdate(ret, currentCache, cacheEngine);
			else
				await cacheEngine.set(finalCachePath, currentCache);
		} else {
			await cacheEngine.clear(finalCachePath);
		}

		return ret;
	}

	async clearCache(...args) {
		return await this.setCache.apply(this, args.slice(0, 2));
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

	header(_name, set) {
		if (arguments.length === 0)
			return;

		var headers = this.headers;
		if (!headers)
			return;

		if (noe(_name))
			return;

		var name = ('' + _name).toLowerCase(),
				keys = Object.keys(headers);

		for (key of keys) {
			if (key.toLowerCase() === name) {
				if (arguments.length > 1) {
					headers[key] = set;
					return set;
				}

				return headers[key];
			}
		}
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
					var fakeData = this.fakeData || (this.apiBase.fakeData && this.apiBase.fakeData[this.routeName]);

					if (fakeData) {
						//Emulate data
						result = fakeData;
					} else {
						//Run query across network
						result = await this.apiBase.fetch.call(this.apiBase, this);
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

				if (this.debug)
					console.warn('API error: ', e);

				result = e;

				//Handle error result
				var events = ['beforeError', 'error', 'complete', 'always'];
				for (var i = 0, il = events.length; i < il; i++) {
					let eventName = events[i];

					try {
						newResult = await this[eventName](result);
						if (newResult !== undefined)
							result = newResult;
					} catch (e) {
						result = e;
					}
				}

				if (result && result instanceof Error)
					throw result;
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

		var internalCache = {};
		Object.defineProperty(this, '_cache', {
			writable: false,
			enumberable: false,
			configurable: false,
			value: internalCache
		});

		this.cacheEngine = {
			get: async function(path) {
				return getProp(internalCache, path);
			},
			set: async function(path, value) {
				return setProp(internalCache, path, value);
			},
			clear: async function(path) {
				return setProp(internalCache, path, null);
			}
		};
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
			return Klass;

		this[name] = async (opts) => {
			let instance = new Klass(opts || {}, name, apiBase);
			return await instance.exec();
		};

		return Klass;
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

module.exports = Object.assign(module.exports, {
	APIRoute: APIRoute,
	API: API
});
