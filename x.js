const utils = require('ethereumjs-util')
const BN = require('bn.js')


let test = {
    type: 'function', name: 'matchERC721UsingCriteria', payable: false, constant: false, stateMutability: 'nonpayable',
    constant: false,
    inputs: [
        { kind: 'owner', name: 'from', type: 'address' },
        { kind: 'replaceable', name: 'to', type: 'address' },
        { kind: 'asset', name: 'token', type: 'address', value: '0xcb2411c2b914b000ad13c86027222a797983ef2d' },
        { kind: 'asset', name: 'tokenId', type: 'uint256', value: '2466' },
        { kind: 'data', name: 'root', type: 'bytes32', value: '0x0000000000000000000000000000000000000000000000000000000000000000' },
        { kind: 'data', name: 'proof', type: 'bytes32[]', value: [] },
    ],
    name: "matchERC721UsingCriteria",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    target: "0xbaf2127b49fc93cbca6269fade0f7f31df4c88a7",
    type: "function",
}

console.log(encodeReplacementPattern(test, "owner"))

function encodeReplacementPattern(abi, replaceKind = "replaceable", encodeToBytes = true) {
    const output = [];
    const data = [];
    const dynamicOffset = abi.inputs.reduce((len, { type }) => {
        const match = type.match(/\[(.+)\]$/);
        return len + (match ? parseInt(match[1], 10) * 32 : 32);
    }, 0);

    abi.inputs
        .map(({ kind, type, value }) => ({
            bitmask: kind === replaceKind ? 255 : 0,
            type: type,
            value: value !== undefined
                ? value
                : generateDefaultValue(type),
        }))
        .reduce((offset, { bitmask, type, value }) => {
            // The 0xff bytes in the mask select the replacement bytes. All other bytes are 0x00.
            const cur = Buffer.alloc(encodeSingle(type, value).length).fill(bitmask);
            if (isDynamic(type)) {
                if (bitmask) {
                    throw new Error('Replacement is not supported for dynamic parameters.');
                }
                output.push(Buffer.alloc(encodeSingle('uint256', dynamicOffset).length));
                data.push(cur);
                return offset + cur.length;
            }
            output.push(cur);
            return offset;
        }, dynamicOffset);
    // 4 initial bytes of 0x00 for the method hash.
    const methodIdMask = Buffer.alloc(4);
    const mask = Buffer.concat([
        methodIdMask,
        Buffer.concat(output.concat(data)),
    ]);
    return encodeToBytes
        ? `0x${mask.toString('hex')}`.slice(0, 458)
        : mask.map(b => (b ? 1 : 0)).join('').slice(0, 458);
};


function generateDefaultValue(type) {
    switch (type) {
        case 'address':
        case 'bytes20':
            /* Null address is sometimes checked in transfer calls. */
            // But we need to use 0x000 because bitwise XOR won't work if there's a 0 in the actual address, since it will be replaced as 1 OR 0 = 1
            return '0x0000000000000000000000000000000000000000';
        case 'bytes32':
            return '0x0000000000000000000000000000000000000000000000000000000000000000';
        case 'bool':
            return false;
        case 'int':
        case 'uint':
        case 'uint8':
        case 'uint16':
        case 'uint32':
        case 'uint64':
        case 'uint256':
            return 0;
        default:
            throw new Error('Default value not yet implemented for type: ' + type);
    }
};





function encodeSingle(type, arg) {
    var size, num, ret, i

    if (type === 'address') {
        return encodeSingle('uint160', parseNumber(arg))
    } else if (type === 'bool') {
        return encodeSingle('uint8', arg ? 1 : 0)
    } else if (type === 'string') {
        return encodeSingle('bytes', new Buffer(arg,'utf8'))
    } else if (isArray(type)) {
        // this part handles fixed-length ([2]) and variable length ([]) arrays
        // NOTE: we catch here all calls to arrays, that simplifies the rest
        if (typeof arg.length === 'undefined') {
            throw new Error('Not an array?')
        }
        size = parseTypeArray(type)
        if (size !== 'dynamic' && size !== 0 && arg.length > size) {
            throw new Error('Elements exceed array size: ' + size)
        }
        ret = []
        type = type.slice(0, type.lastIndexOf('['))
        if (typeof arg === 'string') {
            arg = JSON.parse(arg)
        }
        for (i in arg) {
            ret.push(encodeSingle(type, arg[i]))
        }
        if (size === 'dynamic') {
            var length = encodeSingle('uint256', arg.length)
            ret.unshift(length)
        }
        return Buffer.concat(ret)
    } else if (type === 'bytes') {
        arg = new Buffer(arg)

        ret = Buffer.concat([encodeSingle('uint256', arg.length), arg])

        if ((arg.length % 32) !== 0) {
            ret = Buffer.concat([ret, utils.zeros(32 - (arg.length % 32))])
        }

        return ret
    } else if (type.startsWith('bytes')) {
        size = parseTypeN(type)
        if (size < 1 || size > 32) {
            throw new Error('Invalid bytes<N> width: ' + size)
        }

        return arg
    } else if (type.startsWith('uint')) {
        size = parseTypeN(type)
        if ((size % 8) || (size < 8) || (size > 256)) {
            throw new Error('Invalid uint<N> width: ' + size)
        }

        num = parseNumber(arg)
        if (num.bitLength() > size) {
            throw new Error('Supplied uint exceeds width: ' + size + ' vs ' + num.bitLength())
        }

        if (num < 0) {
            throw new Error('Supplied uint is negative')
        }

        return num.toArrayLike(Buffer, 'be', 32)
    } else if (type.startsWith('int')) {
        size = parseTypeN(type)
        if ((size % 8) || (size < 8) || (size > 256)) {
            throw new Error('Invalid int<N> width: ' + size)
        }

        num = parseNumber(arg)
        if (num.bitLength() > size) {
            throw new Error('Supplied int exceeds width: ' + size + ' vs ' + num.bitLength())
        }

        return num.toTwos(256).toArrayLike(Buffer, 'be', 32)
    } else if (type.startsWith('ufixed')) {
        size = parseTypeNxM(type)

        num = parseNumber(arg)

        if (num < 0) {
            throw new Error('Supplied ufixed is negative')
        }

        return encodeSingle('uint256', num.mul(new BN(2).pow(new BN(size[1]))))
    } else if (type.startsWith('fixed')) {
        size = parseTypeNxM(type)

        return encodeSingle('int256', parseNumber(arg).mul(new BN(2).pow(new BN(size[1]))))
    }

    throw new Error('Unsupported or invalid type: ' + type)
}


function isDynamic(type) {
    // FIXME: handle all types? I don't think anything is missing now
    return (type === 'string') || (type === 'bytes') || (parseTypeArray(type) === 'dynamic')
}

function parseNumber(arg) {
    var type = typeof arg
    if (type === 'string') {
        if (utils.isHexPrefixed(arg)) {
            return new BN(utils.stripHexPrefix(arg),16)
        } else {
            return new BN(arg,10)
        }
    } else if (type === 'number') {
        return new BN(arg)
    } else if (arg.toArray) {
        // assume this is a BN for the moment, replace with BN.isBN soon
        return arg
    } else {
        throw new Error('Argument is not a number')
    }
}

// Is a type an array?
function isArray(type) {
    return type.lastIndexOf(']') === type.length - 1
}

function parseTypeN(type) {
    return parseInt(/^\D+(\d+)$/.exec(type)[1], 10)
}

function parseTypeArray(type) {
    var tmp = type.match(/(.*)\[(.*?)\]$/)
    if (tmp) {
        return tmp[2] === '' ? 'dynamic' : parseInt(tmp[2], 10)
    }
    return null
}