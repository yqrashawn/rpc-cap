const ethereum = window.ethereum

allPerms.addEventListener('click', function() {
  requestPerms({
      readYourProfile: {},
      writeToYourProfile: {},
      eth_accounts: {},
    },
    true,
  )
})

readWrite.addEventListener('click', function() {
  requestPerms({
      readYourProfile: {},
      writeToYourProfile: {},
    },
    true,
  )
})

enable.addEventListener('click', function() {
  if (!ethereum) throw new Error('no window.ethereum')
  ethereum.send('eth_requestAccounts')
  .then(
    result => console.log('ethereum.enable(): ', result)
  )
  .catch(error => showError(error))
})

read.addEventListener('click', readProfile)

eth_accounts.addEventListener('click', () => {
  return ethereum.send('eth_accounts')
  .then(result => console.dir({ message: 'eth_accounts result', result }))
  .catch(error => showError(error))
})

submitName.addEventListener('click', changeName)

/** INIT **/

window.readProfile = readProfile
readProfile()

/** FUNCTIONS **/

async function requestPerms (perms, readWhenDone) {
  ethereum.send('wallet_requestPermissions', [perms])
  .then(result => {
    console.dir({ message: 'wallet_requestPermissions result', result })
    let hasWrite = false
    for (let perm of result.result) {
      if (perm.parentCapability === 'writeToYourProfile') {
        hasWrite = true
        break
      }
    }
    if (readWhenDone) readProfile()
    if (hasWrite) inputZone.style.display = 'block'
  })
  .catch(error => showError(error))
}

function changeName () {
  const name = nameInput.value
  ethereum.send('writeToYourProfile', ['name', name])
  .then(result => {
    console.dir({ message: 'writeToYourProfile result', result })
    readProfile()
  })
  .catch(error => {
    inputZone.style.display = 'none'
    showError(error)
  })
}

function readProfile () {
  ethereum.send('readYourProfile', [])
  .then(result => {
    console.dir({ message: 'readYourProfile result', result })
    inputZone.style.display = 'block'
    content.innerText = `Welcome, ${result.result.name}`
  })
  .catch(error => showError(error))
}

function showError (error) {
  content.innerText = `Had a problem: ${error.message}`
}