---
title: Vavr(颠覆你对Java的认知)
date: '2023/9/10 15:16'
swiper: true
cover: >-
  https://zang-1307996497.cos.ap-beijing.myqcloud.com/v2-241b6bf2362a7ec040194c8baf39af9e_1440w.png
top_img: >-
  url(https://zang-1307996497.cos.ap-beijing.myqcloud.com/v2-241b6bf2362a7ec040194c8baf39af9e_1440w.png)
categories: Lambda
tags:
  - 语法糖
top: true
abbrlink: 9940a3e5
---

# Vavr(颠覆你对Java的认知)

### 什么是Vavr
Vavr core是一个Java函数库。它有助于减少代码量并提高健壮性。函数式编程的第一步是开始思考不可变的值。Vavr 提供不可变的集合以及必要的函数和控制结构来操作这些值。

## 引入依赖

### maven
```xml
<dependencies>
    <dependency>
        <groupId>io.vavr</groupId>
        <artifactId>vavr</artifactId>
        <version>0.10.4</version>
    </dependency>
</dependencies>
```

### gradle
```groovy
dependencies {
    compile "io.vavr:vavr:0.10.4"
}
```
### gradle 7+
```groovy
dependencies {
    implementation "io.vavr:vavr:0.10.4"
}
```


## 1、Tuples(元组)

### 1.1 什么是元组
Java缺少元组的一般概念。元组将固定数量的元素组合在一起，以便它们可以作为一个整体传递。与数组或列表不同，元组可以保存不同类型的对象，但它们也是不可变的。
元组的类型为 Tuple1、Tuple2、Tuple3 等。目前有 8 个元素的上限。要访问元组的元素，可以使用方法访问第一个元素，访问第二个元素，依此类推。tt._1t._2

### 1.2 创建元组
```java
final Tuple2<Integer, String> eliauk = Tuple.of(1, "Eli auk");
Assert.equals(eliauk._1, 1);
Assert.equals(eliauk._2, "Eli auk");
```
> 通过Tuple.of()静态工厂方法创建元组，元组的类型为Tuple2，元组的元素类型为Integer和String，元组的元素个数为2，元组的元素下标从1开始。

### 1.3 逐个映射元组组件
```java
final Tuple2<Integer, String> map = eliauk.map(
        a -> a + 1,
        b -> b + "1"
        );
Assert.equals(map._1, 2);
Assert.equals(map._2, "Eli auk1");
```
> 通过map()方法逐个映射元组组件，map()方法的参数为一个函数，函数的参数为元组的元素，函数的返回值为一个新的元组。


### 1.4 使用一个映射函数映射元组组件
```java
final Tuple2<Integer, String> eliauk = Tuple.of(1, "Eli auk");
final Tuple2<Integer, String> map = eliauk.map((a, b) -> Tuple.of(a + 1, b + "1"));
Assert.equals(map._1, 2);
Assert.equals(map._2, "Eli auk1");
```
> 通过map()方法使用一个映射函数映射元组组件，map()方法的参数为一个函数，函数的参数为元组的元素，函数的返回值为一个新的元组。

### 1.5 变换元组
```java
final String apply = eliauk.apply((a, b) -> b.substring(2) + a);
Assert.equals(apply, "i auk1");
```
> 通过apply()方法变换元组，apply()方法的参数为一个函数，函数的参数为元组的元素，函数的返回值为一个新的元组。

## 2、Function(函数)

### 2.1 什么是函数
函数式编程是关于使用函数进行值和值转换的。Java 8 只提供了一个接受一个参数和一个接受两个参数的参数。Vavr 提供的功能最多为 8 个参数。功能接口被调用等。

### 2.2 创建函数

#### 2.2.1 匿名类创建
```java
Function2<Integer, Integer, Integer> sum = new Function2<Integer, Integer, Integer>() {
    @Override
    public Integer apply(Integer a, Integer b) {
        return a + b;
    }
};
```
> 通过匿名类创建函数，匿名类的参数为函数的参数，匿名类的返回值为函数的返回值。

#### 2.2.2 lambda表达式创建
```java
Function2<Integer, Integer, Integer> sum = (a, b) -> a + b;
```

#### 2.2.3 静态工厂创建
```java
final Function1<Integer, Integer> function1 = Function1.of(a -> a + 1);
```

### 2.3 Composition(组合操作)

#### 2.3.1 andThen
```java
Function1<Integer, Integer> plusOne = a -> a + 1;
Function1<Integer, Integer> multiply = a -> a*2;
final Function1<Integer, Integer> add1AndMultiplyBy2 = plusOne.andThen(multiply);
Assert.equals(add1AndMultiplyBy2.apply(2),6);
```
> 通过andThen()方法组合函数，andThen()方法的参数为一个函数，函数的参数为当前函数的返回值，函数的返回值为一个新的函数。

#### 2.3.2 compose
```java
Function1<Integer, Integer> plusOne = a -> a + 1;
Function1<Integer, Integer> multiply = a -> a*2;
final Function1<Integer, Integer> add1AndMultiplyBy2 = plusOne.compose(multiply);
Assert.equals(add1AndMultiplyBy2.apply(2),5);
```
> 通过compose()方法组合函数，compose()方法的参数为一个函数，函数的参数为当前函数的参数，函数的返回值为一个新的函数。

> andThen()和compose()的区别在于参数的顺序不同，andThen()方法的参数为一个函数，函数的参数为当前函数的返回值，compose()方法的参数为一个函数，函数的参数为当前函数的参数。
> 上边说的解释可能太官方了，大概理解为andThen()方法是先执行当前函数，再执行参数函数，compose()方法是先执行参数函数，再执行当前函数。

### 2.4 Lifting(提升操作)
您可以将部分函数提升为返回结果的总函数。术语偏函数来自数学。从 X 到 Y 的部分函数是函数 f：X′ → Y，对于 X 的某个子集 X′。它推广了函数 f：X → Y 的概念，不强制 f 将 X 的每个元素映射到 Y 的元素。这意味着部分函数仅对某些输入值正常工作。如果使用不允许的输入值调用函数，它通常会引发异常。

#### 2.4.1 lift
```java
Function2<Integer, Integer, Integer> divide = (a, b) -> a / b;
final Option<Integer> apply = Function2.lift(divide).apply(1, 0);
Assert.equals(apply.isEmpty(),true);
```
> 通过lift()方法提升函数，lift()方法的参数为一个函数，函数的参数为当前函数的参数，函数的返回值为一个新的函数，新的函数的返回值为一个Option。

### 2.5 Partial application(部分应用)
部分应用程序允许您通过修复某些值从现有函数派生新函数。您可以修复一个或多个参数，固定参数的数量定义了新函数的 arity，例如 .参数从左到右绑定

#### 2.5.1 apply
```java
Function2<Integer, Integer, Integer> sum = Integer::sum;
Function1<Integer, Integer> add1 = sum.apply(1);
Function5<Integer, Integer, Integer, Integer, Integer, Integer> sum1 = (a, b, c, d, e) -> a + b + c + d + e;
Function2<Integer, Integer, Integer> add6 = sum1.apply(2, 3, 1);
final Function2<Integer, Integer, Integer> memoized = add6.memoized();
Assert.equals(add1.apply(2),3);
Assert.equals(add6.apply(4).apply(5),15);
```
> 通过apply()方法部分应用函数，可以先传一个参数再传一个在传一个从左到右一次绑定

#### 2.5.2 curried
```java
Function2<Integer, Integer, Integer> sum = Integer::sum;
final Function1<Integer, Integer> add1 = sum.curried().apply(1);
Function5<Integer, Integer, Integer, Integer, Integer, Integer> sum1 = (a, b, c, d, e) -> a + b + c + d + e;
final Function1<Integer, Function1<Integer, Function1<Integer, Function1<Integer, Integer>>>> apply = sum1.curried().apply(1);
Assert.equals(add1.apply(2),3);
Assert.equals(apply.apply(2).apply(3).apply(4).apply(5),15);
```
> 区别
> 1. 语法: 偏函数通常通过 .apply() 来指定一些参数，而柯里化则使用 .curried().apply()。
> 2. 返回类型: 偏函数直接返回一个新的函数，这个新的函数期待剩余的参数。柯里化返回一个新的单参数函数，这个函数会返回另一个单参数函数，依此类推。
> 3. 灵活性: 偏函数更灵活，因为你可以一次性指定多个参数。柯里化则严格地每次只能应用一个参数。
> 4. 用途: 偏函数通常用于指定一些固定的参数来创建新的函数。柯里化则更多地用于函数组合和链式调用。

### 2.6 Memoization(记忆化)
记忆是缓存的一种形式。记忆函数仅执行一次，然后从缓存返回结果。
下面的示例在第一次调用时计算一个随机数，并在第二次调用时返回缓存的数字。

#### 2.6.1 memoized
```java
final Function0<Integer> randomGenerator = getRandomGenerator();
final Integer apply = randomGenerator.apply();
final Integer apply1 = randomGenerator.apply();
Assert.equals(apply,apply1);
```
> 肯定大多数人不太理解这个memoized和普通变量声明有什么区别，其实这个memoized是一个函数，这个函数的返回值是一个随机数，但是这个函数只会执行一次，第二次调用的时候会直接返回第一次调用的结果，这就是memoized的作用。
普通变量声明
##### memoized与普通变量的区别与使用场景
1. **配置设置**: 当你有一个固定的值（如配置信息）需要在整个应用程序中使用时。
   ```java
     public static final String API_KEY = "your-api-key-here";
   ```

1. **配置设置**: 当你有一个固定的值（如配置信息）需要在整个应用程序中使用时。
   ```java
   public static final String API_KEY = "your-api-key-here";
   ```

2. **单次计算**: 当你只需要进行一次计算并存储结果时。
   ```java
   double squareRootOfTwo = Math.sqrt(2);
   ```

3. **状态存储**: 当你需要在应用程序的生命周期内维护某种状态时。
   ```java
   int counter = 0;
   ```

4. **临时变量**: 在循环或条件语句中作为临时存储。
   ```java
   for(int i = 0; i < 10; i++) {
       int square = i * i;
       System.out.println(square);
   }
   ```
###### 使用 Function0 和 `.memoized()`

1. **缓存计算密集型操作**: 如果你有一个计算密集型的操作，多次调用它是不高效的，你可以使用 `.memoized()` 来缓存结果。
   ```java
   Function0<Double> expensiveCalculation = Function0.of(() -> {
       // ... some expensive calculations
       return result;
   }).memoized();
   ```

2. **懒加载**: 如果你有一个操作可能不会被立即需要，或者可能根本就不需要，使用 Function0 会更高效。
   ```java
   Function0<DatabaseConnection> lazyDbConnection = Function0.of(() -> connectToDatabase()).memoized();
   ```

3. **函数组合**: 当你需要将多个函数组合在一起进行复杂的操作时，使用 Function0 可以更容易地实现函数组合。
   ```java
   Function0<Integer> combinedFunction = Function0.of(() -> function1()).andThen(result -> function2(result));
   ```

4. **高阶函数**: 当你需要将函数作为参数传递或从另一个函数返回函数时。
   ```java
   public Function0<Double> getRandomGenerator() {
       return Function0.of(Math::random).memoized();
   }
   ```

5. **测试与模拟**: 使用 Function0 可以更容易地在单元测试中模拟依赖。
   ```java
   Function0<Long> currentTimeProvider = Function0.of(System::currentTimeMillis).memoized();
   ```

## 3、Value(值)

### 3.1 Option(选项)
用法可以参考[Stream-Query的Opp](http://stream-query.dromara.org/pages/53b6d6/
)
### 3.2 Try(尝试)
用法可以参考[Stream-Query的Opp中的ofTry](http://stream-query.dromara.org/pages/53b6d6/#oftry
)
### 3.3 Lazy(懒加载)

惰性是表示惰性求值的 monadic 容器类型。与Supplier相比，Lazy 是记忆的，即它只评估一次，因此在引用上是透明的。
```java
Lazy<Double> lazy = Lazy.of(Math::random);
lazy.isEvaluated(); // = false
lazy.get();         // = 0.123 (random generated)
lazy.isEvaluated(); // = true
lazy.get();
Assert.equals(lazy.get(),lazy.get());
final Supplier<Double> doubleSupplier = Math::random;
doubleSupplier.get();
doubleSupplier.get();
Assert.notEquals(doubleSupplier.get(),doubleSupplier.get());
```
> 通过Lazy.of()方法创建Lazy，Lazy.of()方法的参数为一个函数，函数的返回值为Lazy的值，Lazy的值只会计算一次，之后再调用get()方法都会返回第一次计算的值。

### 3.4 Either(左或右)

Either 表示一个值是左值还是右值。通常，左值用于错误，右值用于成功。默认情况下，Either 是一个不可变的类型，但是您可以使用 Either.left() 和 Either.right() 创建可变的 Either。

```java

public void testEither() {
        Either<String, Integer> value = compute().map(i -> i * 2);

        if (value.isRight()) {
            System.out.println("Success: " + value.get());
        } else {
            System.out.println("Failure: " + value.getLeft());
        }
    }

    public static Either<String, Integer> compute() {
        // 模拟一个条件，例如，随机数生成来决定是否成功
        if (RandomUtil.randomBoolean()) {
            // 计算成功，返回一个“右”值
            return Either.right(42);
        } else {
            // 计算失败，返回一个“左”值
            return Either.left("Computation failed");  // 这是一个示例错误消息
        }
    }
```
> 这个方法还是挺有意思的，大多数情况下成功设定为返回右边的值，失败返回左边的值，这样就可以通过isRight()方法判断是否成功，通过get()方法获取值，通过getLeft()方法获取错误信息。
> 还可以对返回成功的值进行一些列的操作也可以使用toEither()自定义失败的返回值

### 3.5 Validation(验证)
验证控件是一个应用函子，有助于累积错误。当尝试组合Monads时，组合过程将在第一次遇到错误时短路。但是“验证”将继续处理组合函数，累积所有错误。这在验证多个字段（例如 Web 表单）时特别有用，并且您希望知道遇到的所有错误，而不是一次一个错误。

#### 3.5.1 combine
##### 3.5.1.1 接下来我们验证一下，首先创建一个实体类Person
```java
class Person {
        final String name;
        final int age;

        Person(String name, int age) {
            this.name = name;
            this.age = age;
        }

        @Override
        public String toString() {
            return "Person(" + name + ", " + age + ")";
        }
    }
```
##### 3.5.1.2 然后编写一个用于验证的方法
```java
public Validation<Seq<String>, Person> validatePerson(String name, int age) {
        return Validation.combine(validateName(name), validateAge(age)).ap(Person::new);
    }

    private Validation<String, String> validateName(String name) {
        return name == null || name.trim().isEmpty() ? Validation.invalid("Name cannot be empty") : Validation.valid(name);
    }

    private Validation<String, Integer> validateAge(int age) {
        return age < 0 || age > 150 ? Validation.invalid("Age must be between 0 and 150") : Validation.valid(age);
    }
```
##### 3.2.1.3 最后编写一个测试方法
```java
Validation<Seq<String>, Person> validPerson = validatePerson("John", 30);
        Assert.equals(validPerson.get().age,30);
        Assert.equals(validPerson.get().name,"John");

        Validation<Seq<String>, Person> invalidPerson = validatePerson(" ", -1);
        Assert.equals(invalidPerson.getError().asJava(), List.of("Name cannot be empty", "Age must be between 0 and 150").asJava());
```

## 4、Collection(集合)

为了设计一个全新的Java集合库，它满足了函数式编程的要求，即不变性，已经投入了很多精力。

Java的Stream将计算提升到不同的层，并在另一个显式步骤中链接到特定的集合。有了Vavr，我们不需要所有这些额外的样板。

### 4.1 List(列表)

Vavr 是一个不可变的链表。突变会创建新的实例。大多数操作都是线性时间执行的。后续操作将逐个执行。

#### 4.1.1 创建列表
##### 4.1.1.1 Java8的使用
```java
final Optional<Integer> reduce = Stream.of(1, 2, 3).reduce(Integer::sum);
final int sum = IntStream.of(1, 2, 3).sum();
```
##### 4.1.1.2 Vavr的使用
```java
final Number sum1 = List.of(1, 2, 3).sum();
final int i = sum1.intValue();
Assert.equals(i,sum);
```

### 4.2 Stream(流)

因为Vavr引入了元组的说明那么与JDK8的Stream相比，Vavr新增了好多便捷的方法以及新特性这里举一个例子

> 将一个list转换为Map

```java
final java.util.Map<Integer, Character> collect = Stream.of(1, 2, 3).collect(Collectors.toMap(a -> a, b -> (char) (b + 64)));
final Map<Integer, Character> map = List.of(1, 2, 3).toMap(a -> a, b -> (char) (b + 64));
Assert.equals(map.get(1).get(), collect.get(1));
// 上边是普通的转换为map的方法，下边是Vavr新加入了元组之后的转换为map的方法
final HashMap<Integer, Character> javaMap = List.of(1, 2, 3).toJavaMap(HashMap::new, a -> Tuple.of(a, (char) (a + 64)));
Assert.equals(javaMap.get(1), 'A');
```

## 5、Property Checking(属性检查)

这个特性需要引入
```xml
<dependency>
   <groupId>io.vavr</groupId>
   <artifactId>vavr-test</artifactId>
   <version>0.10.4</version>
</dependency>
```

```java
Arbitrary<Integer> ints = Arbitrary.integer();

// square(int) >= 0: OK, passed 1000 tests.
Property.def("square(int) >= 0")
        .forAll(ints)
        .suchThat(i -> i * i >= 0)
        .check()
        .assertIsSatisfied();
```
> 通过Arbitrary.integer()方法创建一个随机数，然后通过Property.def()方法创建一个属性，然后通过forAll()方法传入随机数，然后通过suchThat()方法传入一个函数，函数的返回值为boolean，最后通过check()方法检查属性是否满足，最后通过assertIsSatisfied()方法断言属性是否满足。

## 6、Pattern Matching(模式匹配)

模式匹配是一种功能，它允许您根据值的类型和结构执行不同的操作。模式匹配是函数式编程的一个重要特性，因为它允许您编写更简洁，更可读的代码。

### 6.1 基础匹配

```java
final String s = Match(1).of(
        Case($(1), "one"),
        Case($(2), "two"),
        Case($(), "?")
        );
Assert.equals(s,"one");

final String opt = Match(null).of(
        Case($(1), "one"),
        Case($(2), "two"),
        Case($(), "?")
        );
Assert.equals(opt,"?");
```
> 单值匹配，通过Match()，如果值为null可以通过$()匹配，如果值不为null可以通过$(value)匹配

### 6.2 多条件匹配

```java
int input = 5;
String output = Match(input).of(
        Case($(n -> n > 0 && n < 3), "Between 1 and 2"),
        Case($(n -> n > 3 && n < 6), "Between 4 and 5"),
        Case($(), "Other")
);
Assert.equals(output,"Between 4 and 5");
```

### 6.3 断言匹配

```java
final String s = Match(2).of(
        Case($(a -> a==1), "one"),
        Case($(a-> a==2), "two"),
        Case($(), "?")
);
Assert.equals(s,"two");
```

> 断言也就是使用lambda表达式Predicate进行匹配

> Vavr内部还提供了一些常用的断言，比如is(),isIn(),isNotNull(),isNull(),isOneOf(),isZero()等等
比如
```java
final String opt = Match(null).of(
        Case($(is(1)), "one"),
        Case($(is(2)), "two"),
        Case($(), "?")
);
Assert.equals(opt,"?");
```