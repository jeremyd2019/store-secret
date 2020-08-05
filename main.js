const core = require('@actions/core');
const { GitHub, context } = require('@actions/github');
const sodium = require('tweetsodium');

function changeGroup(str) {
  core.endGroup();
  core.startGroup(str);
}

function parseInput() {
  let p_name = core.getInput('name');
  let p_value = core.getInput('value');

  return {
    name: p_name,
    value: p_value,
  }
}

async function run() {
  try {
    const input = parseInput();
    const github = new GitHub(process.env.GITHUB_TOKEN)
    const { owner, repo } = context.repo;
    core.startGroup("Getting public key");
    const { data: { key: key, key_id: key_id } } = await github.actions.getRepoPublicKey({owner, repo});
    const keyBytes = Buffer.from(key, 'base64');
    changeGroup("Encrypting value");
    const messageBytes = Buffer.from(input.value);
    const encryptedBytes = sodium.seal(messageBytes, keyBytes);
    const encrypted = Buffer.from(encryptedBytes).toString('base64');
    changeGroup("Storing secret");
    await github.actions.createOrUpdateRepoSecret({owner, repo, secret_name: input.name, encrypted_value: encrypted, key_id});
    core.endGroup();
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
