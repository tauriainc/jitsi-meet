/* @flow */

/**
 * The {@link RegExp} pattern of the authority of a URI.
 *
 * @private
 * @type {string}
 */
const _URI_AUTHORITY_PATTERN = '(//[^/?#]+)';

/**
 * The {@link RegExp} pattern of the path of a URI.
 *
 * @private
 * @type {string}
 */
const _URI_PATH_PATTERN = '([^?#]*)';

/**
 * The {@link RegExp} pattern of the protocol of a URI.
 *
 * @private
 * @type {string}
 */
const _URI_PROTOCOL_PATTERN = '([a-z][a-z0-9\\.\\+-]*:)';

/**
 * Fixes the hier-part of a specific URI (string) so that the URI is well-known.
 * For example, certain Jitsi Meet deployments are not conventional but it is
 * possible to translate their URLs into conventional.
 *
 * @param {string} uri - The URI (string) to fix the hier-part of.
 * @private
 * @returns {string}
 */
function _fixURIStringHierPart(uri) {
    // Rewrite the specified URL in order to handle special cases such as
    // hipchat.com and enso.me which do not follow the common pattern of most
    // Jitsi Meet deployments.

    // hipchat.com
    let regex
        = new RegExp(
            `^${_URI_PROTOCOL_PATTERN}//hipchat\\.com/video/call/`,
            'gi');
    let match = regex.exec(uri);

    if (!match) {
        // enso.me
        regex
            = new RegExp(
                `^${_URI_PROTOCOL_PATTERN}//enso\\.me/(?:call|meeting)/`,
                'gi');
        match = regex.exec(uri);
    }
    if (match) {
        /* eslint-disable no-param-reassign, prefer-template */

        uri
            = match[1] /* protocol */
                + '//enso.hipchat.me/'
                + uri.substring(regex.lastIndex); /* room (name) */

        /* eslint-enable no-param-reassign, prefer-template */
    }

    return uri;
}

/**
 * Fixes the scheme part of a specific URI (string) so that it contains a
 * well-known scheme such as HTTP(S). For example, the mobile app implements an
 * app-specific URI scheme in addition to Universal Links. The app-specific
 * scheme may precede or replace the well-known scheme. In such a case, dealing
 * with the app-specific scheme only complicates the logic and it is simpler to
 * get rid of it (by translating the app-specific scheme into a well-known
 * scheme).
 *
 * @param {string} uri - The URI (string) to fix the scheme of.
 * @private
 * @returns {string}
 */
function _fixURIStringScheme(uri: string) {
    const regex = new RegExp(`^${_URI_PROTOCOL_PATTERN}+`, 'gi');
    const match = regex.exec(uri);

    if (match) {
        // As an implementation convenience, pick up the last scheme and make
        // sure that it is a well-known one.
        let protocol = match[match.length - 1].toLowerCase();

        if (protocol !== 'http:' && protocol !== 'https:') {
            protocol = 'https:';
        }

        /* eslint-disable no-param-reassign */

        uri = uri.substring(regex.lastIndex);
        if (uri.startsWith('//')) {
            // The specified URL was not a room name only, it contained an
            // authority.
            uri = protocol + uri;
        }

        /* eslint-enable no-param-reassign */
    }

    return uri;
}

/**
 * Gets the (Web application) context root defined by a specific location (URI).
 *
 * @param {Object} location - The location (URI) which defines the (Web
 * application) context root.
 * @public
 * @returns {string} - The (Web application) context root defined by the
 * specified {@code location} (URI).
 */
export function getLocationContextRoot(location: Object) {
    const pathname = location.pathname;
    const contextRootEndIndex = pathname.lastIndexOf('/');

    return (
        contextRootEndIndex === -1
            ? '/'
            : pathname.substring(0, contextRootEndIndex + 1));
}

/**
 * Parses a specific URI string into an object with the well-known properties of
 * the {@link Location} and/or {@link URL} interfaces implemented by Web
 * browsers. The parsing attempts to be in accord with IETF's RFC 3986.
 *
 * @param {string} str - The URI string to parse.
 * @public
 * @returns {{
 *     hash: string,
 *     host: (string|undefined),
 *     hostname: (string|undefined),
 *     pathname: string,
 *     port: (string|undefined),
 *     protocol: (string|undefined),
 *     search: string
 * }}
 */
export function parseStandardURIString(str: string) {
    /* eslint-disable no-param-reassign */

    const obj = {};

    let regex;
    let match;

    // protocol
    regex = new RegExp(`^${_URI_PROTOCOL_PATTERN}`, 'gi');
    match = regex.exec(str);
    if (match) {
        obj.protocol = match[1].toLowerCase();
        str = str.substring(regex.lastIndex);
    }

    // authority
    regex = new RegExp(`^${_URI_AUTHORITY_PATTERN}`, 'gi');
    match = regex.exec(str);
    if (match) {
        let authority = match[1].substring(/* // */ 2);

        str = str.substring(regex.lastIndex);

        // userinfo
        const userinfoEndIndex = authority.indexOf('@');

        if (userinfoEndIndex !== -1) {
            authority = authority.substring(userinfoEndIndex + 1);
        }

        obj.host = authority;

        // port
        const portBeginIndex = authority.lastIndexOf(':');

        if (portBeginIndex !== -1) {
            obj.port = authority.substring(portBeginIndex + 1);
            authority = authority.substring(0, portBeginIndex);
        }

        // hostname
        obj.hostname = authority;
    }

    // pathname
    regex = new RegExp(`^${_URI_PATH_PATTERN}`, 'gi');
    match = regex.exec(str);

    let pathname;

    if (match) {
        pathname = match[1];
        str = str.substring(regex.lastIndex);
    }
    if (pathname) {
        if (!pathname.startsWith('/')) {
            pathname = `/${pathname}`;
        }
    } else {
        pathname = '/';
    }
    obj.pathname = pathname;

    // query
    if (str.startsWith('?')) {
        let hashBeginIndex = str.indexOf('#', 1);

        if (hashBeginIndex === -1) {
            hashBeginIndex = str.length;
        }
        obj.search = str.substring(0, hashBeginIndex);
        str = str.substring(hashBeginIndex);
    } else {
        obj.search = ''; // Google Chrome
    }

    // fragment
    obj.hash = str.startsWith('#') ? str : '';

    /* eslint-enable no-param-reassign */

    return obj;
}

/**
 * Parses a specific URI which (supposedly) references a Jitsi Meet resource
 * (location).
 *
 * @param {(string|undefined)} uri - The URI to parse which (supposedly)
 * references a Jitsi Meet resource (location).
 * @public
 * @returns {{
 *     room: (string|undefined)
 * }}
 */
export function parseURIString(uri: ?string) {
    if (typeof uri !== 'string') {
        return undefined;
    }

    const obj
        = parseStandardURIString(
            _fixURIStringHierPart(_fixURIStringScheme(uri)));

    // Add the properties that are specific to a Jitsi Meet resource (location)
    // such as contextRoot, room:

    // contextRoot
    obj.contextRoot = getLocationContextRoot(obj);

    // The room (name) is the last component of pathname.
    const { pathname } = obj;

    obj.room = pathname.substring(pathname.lastIndexOf('/') + 1) || undefined;

    return obj;
}

/**
 * Attempts to return a {@code String} representation of a specific
 * {@code Object} which is supposed to represent a URL. Obviously, if a
 * {@code String} is specified, it is returned. If a {@code URL} is specified,
 * its {@code URL#href} is returned. Additionally, an {@code Object} similar to
 * the one accepted by the constructor of Web's ExternalAPI is supported on both
 * mobile/React Native and Web/React.
 *
 * @param {string|Object} obj - The URL to return a {@code String}
 * representation of.
 * @returns {string} - A {@code String} representation of the specified
 * {@code obj} which is supposed to represent a URL.
 */
export function toURLString(obj: ?(string | Object)): ?string {
    let str;

    switch (typeof obj) {
    case 'object':
        if (obj) {
            if (obj instanceof URL) {
                str = obj.href;
            } else {
                str = _urlObjectToString(obj);
            }
        }
        break;

    case 'string':
        str = String(obj);
        break;
    }

    return str;
}

/**
 * Attempts to return a {@code String} representation of a specific
 * {@code Object} similar to the one accepted by the constructor
 * of Web's ExternalAPI.
 *
 * @param {Object} obj - The URL to return a {@code String} representation of.
 * @returns {string} - A {@code String} representation of the specified
 * {@code obj}.
 */
function _urlObjectToString({ url }: Object): ?string {
    // TODO Support properties other than url. Support (pretty much) all
    // properties accepted by the constructor of Web's ExternalAPI.
    return url;
}
