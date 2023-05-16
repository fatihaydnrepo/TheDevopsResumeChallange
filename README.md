# THE DEVOPS RESUME CHALLANGE 

Öncelikle bir static websitesi oluşturmak istedim bunun için html, css ve javascript içeren bir kod bloğunu kendim için yeniden tasarladım, sonrasında hazırlamış olduğum bu websitesini bir container haline getirmek için dockerfile'ını oluşturdum
```json
--- Ubuntu 22.04 kullandım

FROM ubuntu:22.04

--- Nginx'i ve gerekli paketleri yükledim

RUN apt-get update && apt-get install -y \
nginx \
curl \
wget \
gnupg \
git \
nano

--- Uygulama dosyalarını Docker içine kopyaladım

COPY index.html /var/www/html/
COPY css/ /var/www/html/css/
COPY js/ /var/www/html/js/
RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html

--- Nginx'i yapılandırdım

RUN echo "daemon off;" >> /etc/nginx/nginx.conf
RUN sed -i 's#listen\s*80#listen 8080#' /etc/nginx/sites-enabled/default

--- 8080 portunu kullandım

EXPOSE 8080

--- Nginx'i başlattım

CMD ["nginx"]
```
Ardından Dockerfile'ımın bulunduğu dosya içerisinde terminal açarak aşağıdaki komut ile image oluşturdum.
> docker build -t reptilianusbileciktus/website:v1 .

Oluşturduğum image'i dockerhub'a göndermek için aşağıdaki komutu kullandım.
> docker push reptilianusbileciktus/website:v1

Sonrasında farklı bir bilgisayardan bu image'i çekip çalıştığını doğruladım. 
![Windows](https://github.com/fatihaydnrepo/TheDevopsResumeChallange/blob/main/WhatsApp%20Image%202023-05-17%20at%2000.28.01.jpeg?raw=true)

Websitemi ücretsiz bir şekilde yayınlamak için aws üzerinde bir hesap oluşturdum sonrasında EC2 ile website isimli bir instance oluşturdum.

![enter image description here](https://github.com/fatihaydnrepo/TheDevopsResumeChallange/blob/main/Screenshot%20from%202023-05-17%2000-33-08.png?raw=true)
Bu instance ' e uygun olarak bir security ve target group'da oluşturdum bu hususta izlediğim adımlara [buradan ulaşabilirsiniz.](https://www.youtube.com/watch?v=JfuudtTiwgk)

Burada dikkat etmemiz gereken şey amazon free tier olarak bize t2.micro olan makineler sunmakta ve   1 vCPU ve 1 GB RAM vermektedir.  Bu sebeple instance içerisine k3s kurarak ilerleyeceğiz. 

İndirdiğimiz .pem dosyasının bulunduğu dizinde aşağıdaki komutu kullanarak instance'ımıza bağlanıyoruz, benim .pem dosyamın ismi website'idi dolayısıyla aşağıdaki komut ile bağlantımı sağladım.

> ssh -i website.pem ubuntu@<-ip-adress->

sonrasında k3s bir cluster olarak değilde tek node üzerinden kuracağımız için yapılandırma ayarlarını geçerek aşağıdaki şekilde indirdim.

> curl -sfL https://get.k3s.io | sh -
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
kubectl get nodes

![enter image description here](https://github.com/fatihaydnrepo/TheDevopsResumeChallange/blob/main/Screenshot%20from%202023-05-17%2000-47-35.png?raw=true)

Kubectl komutununda çalıştığını doğruladıktan sonra uygulamamızın çalışacağı pod'u oluşturmak ve düzenlemek için deploymant.yaml adında bir dosya oluşturdum ve aşağıdaki komutları girdim 

```json                             
apiVersion: apps/v1
kind: Deployment
metadata:
  name: website-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: website-deployment
  template:
    metadata:
      labels:
        app.kubernetes.io/name: website-deployment
    spec:
      containers:
        - name: website-container
          image: reptilianusbileciktus/website:v1
          ports:
            - containerPort: 8080
```

Bu komutları kısaca şu şekilde tanımlayabiliriz:

-   `apiVersion`: Kullanılan Kubernetes API versiyonunu belirtir. Örneğin, `apps/v1` Deployment API versiyonunu kullanır.
-   `kind`: Kubernetes kaynağının türünü belirtir. Bu durumda, bir Deployment tanımlanacağı için `kind: Deployment` olarak ayarlanır.
-   `metadata`: Deployment'in meta verilerini içerir. Bu bölümde Deployment'in adı gibi bilgiler yer alır.
-   `spec`: Deployment'in özelliklerini belirtir. Replica sayısı, seçici etiketler, Pod template'i gibi özellikler bu bölümde tanımlanır.
-   `selector`: Deployment ile ilişkilendirilecek Pod'ları seçmek için kullanılan etiketleri belirtir.
-   `template`: Oluşturulacak Pod'ların template'ini tanımlar. Pod içindeki container, imaj, portlar gibi özellikler bu bölümde belirtilir.

Sonrasında service.yaml dosyası oluşturdum
```json                             
apiVersion: v1
kind: Service
metadata:
  name: website-svc
spec:
  type: LoadBalancer
  externalIPs:
    - 18.170.88.176
  selector:
    app.kubernetes.io/name: website-deployment
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080

```

sonrasında traefik.yaml dosyası oluşturdum
```json                             
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: website-route
spec:
  entryPoints:
    - web
  routes:
    - match: Host(`18.170.88.176`)
      kind: Rule
      services:
        - name: website-svc
          port: 80
```
to be continued
