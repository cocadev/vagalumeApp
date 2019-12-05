# Aplicativo Vagalume.FM

Aqui a música não para! Sintonize uma estação com seu estilo e deixe rolar! Repositório onde se encontra os arquivos da plataforma Android e IOS desenvolvido em React Native.
Você pode acessar aqui o link do aplicativo na loja do [Android](https://play.google.com/store/apps/details?id=br.com.vagalume.fm&hl=pt_BR) e do [iOS](https://itunes.apple.com/br/app/vagalume.fm/id1154246231?mt=8).

## Dependências
Você pode verificar a instalação do React Native [aqui](https://facebook.github.io/react-native/docs/getting-started.html) e depois clicando na seção **Building Projects with Native Code**. Após a instalação do React Native basta clonar, entrar no repositório e rodar o comando *npm install* para instalar as dependências.

## Comandos principais
Compila o projeto no modo de desenvolvimento na plataforma selecionada. Importante lembrar que caso queira rodar o projeto no iOS é preferível usar o XCode para compilar:
```sh
$ react-native run-[android|ios]
```


Compila o projeto no modo de produção na plataform selecionada:
```sh
$ react-native run-[android] --variant=release
```


Compila o projeto e gera o apk no modo de produção (Android):
```sh
$ cd android && ./gradlew assembleRelease
```


Inicia o server que irá processar os javascripts na aplicação:
```sh
$ react-native start
```


Faz a conexão do plugin instalado na plataforma nativa. No iOS algumas dependências devem ser instaladas utilizando o comando *pod install* dentro da pasta *ios* do projeto:
```sh
$ react-native link [nome da dependência]
```


Se você estiver utilizando um dispositivo para rodar o aplicativo em desenvolvimento
este comando irá conectar o device no server javascript:
```sh
$ adb reverse tcp:8081 tcp:8081
```


## Bugsnag
Bugsnag é uma plataforma de relatórios de erros bem completa, estamos utilizando no projeto para facilitar a localização dos bugs nos arquivos do projeto, clicando [aqui](https://app.bugsnag.com/vagalume-2/vagalume-dot-fm/errors?filters[event.since][0]=30d&filters[error.status][0]=open&filters[event.severity][0][value]=error&filters[event.severity][0][type]=eq&filters[app.release_stage][0][value]=production&filters[app.release_stage][0][type]=eq) você pode acessar o painel e acompanhar os relatórios.


### Como gerar e enviar o *.map* do projeto?
Sempre quando é lançada uma nova versão do aplicativo temos que atualizar o arquivo que .map que faz o trabalho de facilitar a localização das linhas do arquivo, já que em produção os javascripts estão minificados. Para enviar basta os seguintes comandos dentro do projeto:

### 1º Gerando o *.map* 

Trocar [android | ios] por uma das plataformas sem '[]'
```sh
$ react-native bundle \
	--platform [android | ios] \
	--dev false \
	--entry-file index.js \
	--bundle-output [android | ios]-release.bundle \
	--sourcemap-output [android | ios]-release.bundle.map
```

### 2º Enviando o arquivo *.map* do projeto para Bugsnag

***Utilizando o bugsnag-sourcemaps (recomendado)***

Instalando o package usando o npm:
```sh
$ npm install -g bugsnag-sourcemaps
```
e depois trocar ´[app-version]´ pela versão atual:
```sh
$ bugsnag-sourcemaps upload \
	--api-key 6b72162240cb5dbea6828c5409a2ea73 \
	--app-version [app-version] \
	--code-bundle-id [app-version] \
	--minified-file [android | ios]-release.bundle \
	--source-map [android | ios]-release.bundle.map \
	--minified-url index.[android | ios].bundle \
	--overwrite \
	--upload-sources 
```

***Utilizando o curl***
Trocar ´[app-version]´ pela versão atual:
```sh
$ curl https://upload.bugsnag.com/ -F apiKey=6b72162240cb5dbea6828c5409a2ea73   -F codeBundleId=[app-version] -F minifiedUrl="index.android.bundle" -F minifiedFile=@android/app/src/main/assets/index.android.bundle -F sourceMap=@android/app/src/main/assets/index.android.map -F overwrite=true -F \*/index.js=@index.js
```


## Firebase
Todos os eventos de controle de acesso, notificações, erros e outras medições estamos fazendo no [Firebase](https://console.firebase.google.com/project/vagalume-fm/overview). O aplicativo atualmente está enviando os mesmos eventos tanto para o Firebase como para o Bugsnag e o Google Analytics.

### Enviando notificações para o aplicativo
Utilizando o Firebase fica fácil enviar uma notificação para os usuários, acessando o [painel](https://console.firebase.google.com/project/vagalume-fm/notification/compose) de notificacões, você pode compor uma nova clicando em **Nova Mensagem** e colocar o título e o corpo da notificação.

Por padrão quando o usuário clica para abrir, ele é enviado para a home do aplicativo mas caso você queira enviar para uma estação específica basta clicar em **Opções avançadas** quando estiver criando uma nova notificação e depois na seção de **Personalizar dados** criar uma chave chamada *stationID* com o valor do ID da estação.

Não esqueça de ativar o som nas **Opções Avançadas** para o usuário receber a notificação completa.

## Versionamento
Existem alguns lugares importantes no projeto que é necessário trocar a versão caso for enviada uma atualização para loja.

* android/app/build.gradle
* android/app/src/main/AndroidManifest.xml
* ios/VagalumeFM/Info.plist
* src/lib/bugnag.js
* package.json
* version.json

Para facilitar a visão dos arquivos a serem alterados, use o grep do git + a versão a ser alterada (Com aspas):
```sh
$ git grep "[versão a ser alterada]"
```

## Produção (Android)
Para gerar o *apk* rode o comando
```sh
$ react-native run-android --variant=release
```

ou

```sh
$ cd android && ./gradlew assembleRelease
```

O arquivo será gerado na pasta *android/app/build/apk/app-release.apk*.

## Produção (iOS)
Para enviar o aplicativo para App Store o processo é o mesmo de um aplicativo nativo, é necessário primeiro pelo XCode fazer o **Archive** do aplicativo e depois de criada a versão, enviar para App Store.
