# THE JUNIOR DEVOPS RESUME CHALLANGE 

Öncelikle bir static websitesi oluşturmak istedim bunun için html, css ve javascript içeren bir kod bloğunu kendim için yeniden tasarladım, sonrasında hazırlamış olduğum bu websitesini bir container haline getirmek için dockerfile'ını oluşturdum. 
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

Burada dikkat etmemiz gereken şey amazon free tier olarak bize t2.micro olan makineler sunmakta ve   1 vCPU ve 1 GB RAM vermektedir.  Bu sebeple instance içerisine k3s kurarak ilerleyeceğiz. Oluşturduğumuz makine Minikube sistem gereksinimlerini karşılamamaktadır.

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

Yukarıdaki komutlar neyi ifade ediyor ? 

`apiVersion: apps/v1` ve `kind: Deployment` satırları, bu manifest dosyasının  Kubernetes API'siyle etkileşimde bulunacağını ve bir Deployment nesnesi oluşturacağını belirtiyor

`metadata` bölümü, Deployment nesnesinin meta verilerini tanımlar. Bizim örneğimizde `name` alanını, Deployment'in adını "website-deployment" olarak belirttik. Bu ad, Deployment'i benzersiz bir şekilde tanımlamak için kullanılır.

`spec` bölümü, Deployment'in yapılandırmasını tanımlıyor.

-   `replicas: 1`, Deployment'in kaç kopyasının oluşturulacağını belirler. Sistemi yormamak adına 1 replica olarak tanımladım.

- `selector` bölümü, Deployment'in hangi pod'ları seçeceğini belirtir. Pod'lar, label'lar ile eşleştiğinde Deployment tarafından yönetilir. Bu durumda, pod'ların `app.kubernetes.io/name: website-deployment` etiketine sahip olması gerekmektedir.

- `template` bölümü, Deployment tarafından oluşturulan pod'ların yapılandırmasını tanımlıyor.
- `spec` bölümü, pod'ların yapılandırmasını tanımlar. Bu durumda, sadece bir konteyner oluşturacağız.

-   `name: website-container`, oluşturulan konteynerin adını belirtir.
    
-   `image: reptilianusbileciktus/website:v1`, kullanılacak konteyner imajını belirtir. Bu durumda, `reptilianusbileciktus/website` deposundaki `v1` etiketine sahip imajı kullanacağız..
    
-   `ports` bölümü, konteynerin hangi portunu açacağını belirtir. Bu durumda, konteynerin 8080 numaralı portunu kullanacağız.

> kubectl apply -f deployment.yaml

Komutunu çalıştırarak YAML dosyasında bulunan Deployment objesinin Kubernetes kümesine uygulanmasını sağlayacağız.

> kubectl get pods -o wide

ile podumuzun oluşup oluşmadığını kontrol ediyoruz.

# buraya resim
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
Burada farklı olarak spec'in altında bulunan kısımlarda type olarak bir LoadBalancer olduğunu belirttim bunun sebebi dışarıdan gelen talepleri belirtilen port üzerinden hedeflenen pod'lara dağıtacak bir yük dengeleyici sağlamaktır ayrıca ; 
-   `externalIPs` bölümü, kısmında "18.170.88.176" IP adresi dışarıdan erişim sağlamak için kullanılacak IP adresi olarak belirledim, bu benim instance'ımın ip adresi
    
-   `selector` bölümü, Service'in hangi pod'ları hedef alacağını belirtmektedir.
    
-   `ports` bölümü, Service'in hangi portunu dinleyeceğini ve hangi pod portuna yönlendirme yapacağını belirtir. Bu durumda, Service 80 numaralı portu dinleyecek ve gelen trafiği `targetPort` olarak belirtilen 8080 numaralı pod portuna yönlendirecektir.

> kubectl apply -f service.yaml

Komutunu çalıştırarak YAML dosyasında bulunan service objemizin çalışmasını sağlıyoruz..

> kubectl get svc -o wide

ile service'imizin doğru şekilde  oluşup oluşmadığını kontrol ediyoruz.

# buraya resim

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

-   `apiVersion: traefik.containo.us/v1alpha1` ve `kind: IngressRoute` satırları, Traefik IngressRoute nesnesini oluşturacağımızı belirtir.
   
-   `spec` bölümü, IngressRoute'un yapılandırmasını tanımlamaktadır.
    
    -   `entryPoints` bölümü, gelen isteklerin hangi entry point'ten kabul edileceğini belirtir. Bu durumda, "web" entry point'i kullanılıyor. (etrypoint gelen isteklerin kabul edildiği noktayı ifade etmektedir.)
        
	- `routes` bölümü, gelen isteklerin nasıl yönlendirileceğini belirtir. Bu bölümdeki yapılandırma, gelen isteklerin belirli bir kurala göre hedef bir hizmete yönlendirilmesini sağlar.
	-   `match` alanı, isteklerin nasıl eşleştirileceğini belirtir. Burada, `Host(`18.170.88.176`)` ifadesi kullanarak, gelen isteklerin "18.170.88.176" IP adresiyle eşleşmesi gerektiğini belirtiyoruz. Yani, sadece bu IP adresine gelen istekler bu kurala uygun olacaktır.
    
	-   `kind: Rule` ifadesiyle bu yönlendirmenin bir kural olarak yapılandırıldığını belirtiyoruz. Bu kural, gelen isteklerin belirli bir ölçüte (host adresine göre eşleşme) dayalı olarak yönlendirilmesini sağlar.
    
	-   `services` bölümü, yönlendirilen isteklerin hangi hizmete yönlendirileceğini belirtir. Burada, "website-svc" adlı hizmeti belirtiyoruz. Yani, bu kurala uyan istekler, belirtilen hizmete yönlendirilecektir.

> kubectl apply -f traefik.yaml

Komutunu çalıştırarak traefik.yaml dosyasını apply ediyoruz.

Traefik IngressRoute, gelen isteklerin belirlediğimiz ölçütlere göre nasıl yönlendirileceğini ve hangi hizmete yönlendirileceğini belirtir. Burada `Host(`18.170.88.176`)` ile eşleşen istekler,  Service'e yönlendirilir. Yani, IngressRoute, istemcilerin belirli bir IP veya alan adına yönlendirilmesini sağlar.

Kubernetes Service ise, belirli bir hizmetin erişilebilirliğini sağlar. LoadBalancer tipi Service, dışarıdan erişim sağlamak için bir yük dengeleyici IP'si kullanılmasını sağlar. Bu sayede, dış IP adresine gelen istekler Service'e yönlendirilir.

Yani, Traefik IngressRoute, gelen istekleri doğru hizmete yönlendirmek için kullanılırken, Kubernetes Service ise hizmetin erişilebilirliğini sağlamak için kullanılır. İkisini birlikte kullanarak, gelen isteklerin doğru hizmete yönlendirilmesini ve hizmetin dışarıdan erişilebilir olmasını sağlamış olursunuz.
