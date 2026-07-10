import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const packageJsonPath = path.resolve('package.json');
const configXmlPath = path.resolve('config.xml');

try {
  // 0. Tentar encerrar o aplicativo na TV para liberar os arquivos para a desinstalação
  try {
    console.log('[Version Bump] Tentando encerrar o aplicativo na TV (AeqayXtEeN.dontmovietizen)...');
    let sdbCmd = 'sdb';
    const tizenSdbPath = 'C:\\Users\\user\\.tizen-extension-platform\\server\\sdktools\\data\\tools\\sdb.exe';
    if (fs.existsSync(tizenSdbPath)) {
      sdbCmd = `"${tizenSdbPath}"`;
    }
    execSync(`${sdbCmd} shell 0 vd_appterminate AeqayXtEeN.dontmovietizen`, { stdio: 'ignore' });
    console.log('[Version Bump] Comando de encerramento enviado à TV.');
  } catch (err) {
    console.log('[Version Bump] Aviso: Não foi possível encerrar o app na TV remotamente (TV offline ou sdb indisponível).');
  }

  // 1. Ler e incrementar a versão no package.json
  const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const oldVersion = packageData.version || '1.0.0';
  
  const versionParts = oldVersion.split('.');
  if (versionParts.length === 3) {
    versionParts[2] = String(Number(versionParts[2]) + 1);
  } else {
    versionParts.push('1');
  }
  const newVersion = versionParts.join('.');
  
  packageData.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageData, null, 2) + '\n', 'utf8');
  console.log(`[Version Bump] package.json atualizado: ${oldVersion} -> ${newVersion}`);

  // 2. Atualizar a versão no config.xml
  if (fs.existsSync(configXmlPath)) {
    let xmlContent = fs.readFileSync(configXmlPath, 'utf8');
    
    // Expressão regular para encontrar e substituir o atributo version no elemento widget
    const widgetVersionRegex = /(<widget[^>]*\bversion=")[^"]*(")/;
    if (widgetVersionRegex.test(xmlContent)) {
      xmlContent = xmlContent.replace(widgetVersionRegex, `$1${newVersion}$2`);
      fs.writeFileSync(configXmlPath, xmlContent, 'utf8');
      console.log(`[Version Bump] config.xml atualizado para a versão: ${newVersion}`);
    } else {
      console.warn('[Version Bump] Atributo version não encontrado na tag <widget> do config.xml.');
    }
  } else {
    console.warn('[Version Bump] Arquivo config.xml não encontrado.');
  }
} catch (error) {
  console.error('[Version Bump] Erro ao incrementar versão:', error);
  process.exit(1);
}
