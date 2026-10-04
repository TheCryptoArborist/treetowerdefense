@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Canopy Defense - Update and Play
rem The downloaded copy can stay in Downloads. Installed copies use their own repo.
set "CANOPY_REPO=D:\Finance\Crypto\Repos\treetowerdefense"
if exist "%~dp0tools\serve.mjs" set "CANOPY_REPO=%~dp0"
if not exist "%CANOPY_REPO%\tools\serve.mjs" (
  echo Cannot find the Canopy Defense clone at %CANOPY_REPO%.
  echo Place this launcher beside index.html in your existing clone.
  goto failed
)
cd /d "%CANOPY_REPO%" || goto failed
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 20 or later, then reopen this launcher.
  goto failed
)
where git >nul 2>nul
if errorlevel 1 (
  echo Install Git for Windows, then reopen this launcher.
  goto failed
)
rem Node avoids PowerShell execution-policy problems. No stash, reset, or force.
node -e "const{execFileSync}=require('node:child_process');const{realpathSync}=require('node:fs');const canonical=p=>require('node:path').resolve(realpathSync.native(p)).toLowerCase();const git=(...a)=>execFileSync('git',a,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();try{if(Number(process.versions.node.split('.')[0])<20)throw Error('Node.js 20 or later is required.');if(canonical(git('rev-parse','--show-toplevel'))!==canonical(process.cwd()))throw Error('This folder is not the root of the clone.');if(!/^(https:\/\/github\.com\/TheCryptoArborist\/treetowerdefense(?:\.git)?|git@github\.com:TheCryptoArborist\/treetowerdefense(?:\.git)?)$/i.test(git('remote','get-url','origin')))throw Error('The origin remote is not the expected Canopy Defense repository.');if(git('symbolic-ref','--quiet','--short','HEAD')!=='main')throw Error('Switch this clone to main before using the launcher.');if(git('status','--porcelain'))throw Error('Local edits or untracked files found. Commit or move them before updating; nothing was overwritten.');console.log('Fetching the latest Canopy Defense build...');execFileSync('git',['fetch','origin','main'],{stdio:'inherit'});try{git('merge-base','--is-ancestor','HEAD','origin/main');}catch{throw Error('Local main has commits outside origin/main. Resolve them before updating; nothing was overwritten.');}execFileSync('git',['merge','--ff-only','origin/main'],{stdio:'inherit'});}catch(e){console.error('Update stopped: '+(e.status!==undefined?'Git could not complete the update. Check the connection and repository state.':e.message));process.exit(1);}"
if errorlevel 1 goto failed
node tools\preview.mjs
if errorlevel 1 goto failed
exit /b 0
:failed
echo.
echo Canopy Defense did not launch. Your saved game has not been reset.
pause
exit /b 1
