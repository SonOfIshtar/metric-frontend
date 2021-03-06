import EthIcon from './eth.png'
import HypeIcon from './hype.png'
import {accountAddress, isWalletConnected} from "./wallet_manager";
import {Erc20ContractProxy} from "./erc20_contract_proxy";
import {fetchJson} from "./json_api_fetch";
import {fetch0xAllowanceForToken} from "./0x_orders_proxy";
import {CustomTokenManager} from "./tokens/CustomsTokenManager";
import {Token} from "./tokens/token";


export function registerForTokenListUpdate(item) {
    register.push(item)
}

export function registerForTokenBalancesUpdate(item) {
    balancesRegister.push(item)
}

export function registerForTokenAllowancesUpdate(item) {
    allowancesRegister.push(item)
}

export function disableToken(symbol) {
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].symbol.toLowerCase() === symbol.toLowerCase()) {
            tokens[i].disabled = true
        }
    }
}

export async function findOrAddTokenWithAddress(address) {
    let token = findTokenWithAddress(address)
    if (token === undefined) {
        await addTokenWithAddress(address)
    }
    return findTokenWithAddress(address)
}

export function findTokenWithAddress(address) {
    return tokensList().find(t => t.address.toLowerCase().startsWith(address.toLowerCase()))
}

export function tokensList() { return tokens }

export function updateTokenAllowance(address, allowance) {
    let token = tokens.find(t => t.address.toLowerCase() === address.toLowerCase())
    token.allowance = formatAmount(allowance / (10 ** token.decimals))
}

export async function fetchTokensAllowances() {

    await Promise.all(
        tokens.map( async (token) => {
            let allowance = await fetchTokenAllowance(token)
            if (token.allowance !== allowance) {
                token.allowance = allowance
                await Promise.all(
                    allowancesRegister.map(item => item.onTokenAllowancesUpdate())
                )
            }
        })
    )

    setTimeout(fetchTokensAllowances, 10000)
}

export async function fetchTokensBalances() {

    await Promise.all(
        tokens.map(async (token) => {
            let balance = await fetchTokenBalance(token)
            if (token.balance !== balance) {
                token.balance = balance
                await Promise.all(
                    balancesRegister.map(item => item.onTokenBalancesUpdate())
                )
            }
        })
    )

    setTimeout(fetchTokensBalances, 10000)
}

async function fetchTokenBalance(token) {

    let tokenBalance = 0

    if (isWalletConnected()) {
        if (token.symbol.toLowerCase() === "eth") {
            tokenBalance = formatAmount(await window.web3.eth.getBalance(accountAddress()))
        } else {
            let contract = Erc20ContractProxy.erc20Contract(token.address)
            tokenBalance = formatAmount(await contract.methods.balanceOf(accountAddress()).call())
        }
    }

    return formatAmount(tokenBalance) / (10**token.decimals)
}

async function fetchTokenAllowance(token) {

    let tokenAllowance = 0

    if (isWalletConnected()) {
        if (token.symbol.toLowerCase() !== "eth") {
            if (token.balance > 0) {
                tokenAllowance = await fetch0xAllowanceForToken(token.address)
            }
        }
    }

    return formatAmount(tokenAllowance) / (10**token.decimals)
}

function formatAmount(amount) {
    return isNaN(amount) ? 0 : amount
}

export async function loadTokenList()
{
    await fetchJson("https://tokens.coingecko.com/uniswap/all.json")
        .then(json => {
            if (json.tokens !== undefined) {
                return Array.from(json.tokens)
            } else {
                return []
            }
        })
        .then(at => {
            at.forEach(t => {
                addToken({
                    balance: 0,
                    allowance: 0,
                    address: t.address,
                    symbol: t.symbol,
                    decimals: t.decimals,
                    logoURI: t.logoURI,
                    volume_limit: -1
                })
            })
        })

    await Promise.all(
        register.map(item => item.onTokenListUpdate())
    )
}

export function isTokenAmountOverLimit(token, amount) {
    return amount.isGreaterThan(token.volume_limit * (10 ** token.decimals))
}

export function addToken(token) {
    if (tokens.find(t => t.symbol === token.symbol) === undefined) {
        tokens.push(token)
    }
}

export async function addTokenWithAddress(address) {
    try {
        let token = { address: address }
        let contract = Erc20ContractProxy.erc20Contract(address)
        token.symbol = await contract.methods.symbol().call().then(s => s.toUpperCase())
        token.decimals = await contract.methods.decimals().call().then(s => parseInt(s))
        token.balance = 0
        token.allowance = 0
        token.volume_limit = -1

        customTokensManager.addToken(new Token(token.symbol, token.address, token.decimals))

        addToken(token)

        register.map(item => item.onTokenListUpdate())

    } catch (e) {
        console.log(e.message)
        console.log("Invalid token address:", address)
    }
}

function initTokenList() {
    let tokens = defaultTokens
    customTokensManager.init()
    customTokensManager.customtokens.tokens.forEach(t => {
        tokens.push({
            balance: t.balance,
            allowance: 0,
            address: t.address,
            symbol: t.symbol,
            decimals: t.decimals,
            logoURI: t.logoURI,
            volume_limit: -1
        })
    })

    return tokens
}
let defaultTokens = [
    {
        address: "0x6e36556b3ee5aa28def2a8ec3dae30ec2b208739",
        decimals: 18,
        symbol: "BUILD",
        logoURI: "https://etherscan.io/token/images/build_32.png",
        balance: 0,
        allowance: 0,
        volume_limit: -1,
        disabled: false
    },
    {
        address: "0xEfc1C73A3D8728Dc4Cf2A18ac5705FE93E5914AC",
        decimals: 18,
        symbol: "METRIC",
        logoURI: "https://etherscan.io/token/images/metric_32.png",
        balance: 0,
        allowance: 0,
        volume_limit: -1,
        disabled: false
    },
    {
        address: "0x0000000000000000000000000000000000000000",
        symbol: "ETH",
        decimals: 18,
        logoURI: EthIcon,
        balance: 0,
        allowance: 0,
        volume_limit: -1,
        disabled: false
    },
    {
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        decimals: 18,
        symbol: "DAI",
        logoURI: "https://etherscan.io/token/images/MCDDai_32.png",
        balance: 0,
        allowance: 0,
        volume_limit: 10,
        disabled: false
    },
    {
        address: "0xe1212f852c0ca3491ca6b96081ac3cf40e989094",
        decimals: 18,
        symbol: "HYPE",
        logoURI: HypeIcon,
        balance: 0,
        allowance: 0,
        volume_limit: -1,
        disabled: false
    }
]
let customTokensManager = new CustomTokenManager()

let tokens = initTokenList()
let register = []
let balancesRegister = []
let allowancesRegister = []

