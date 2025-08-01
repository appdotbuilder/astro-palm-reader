
import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import type { 
  User, 
  CreateUserInput, 
  Language, 
  PalmReading, 
  AstrologyReading,
  UploadImageInput,
  CreateAstrologyReadingInput 
} from '../../server/src/schema';

// Translation keys for UI elements
const translations = {
  bengali: {
    welcome: '🌟 ভবিষ্যৎ জানুন',
    welcome_desc: 'হস্তরেখা ও জ্যোতিষশাস্ত্রের মাধ্যমে আপনার ভবিষ্যৎ আবিষ্কার করুন',
    create_account: 'অ্যাকাউন্ট তৈরি করুন',
    name: 'নাম',
    email: 'ইমেইল',
    language: 'ভাষা',
    palm_reading: '🖐️ হস্তরেখা দেখুন',
    astrology: '✨ জ্যোতিষ পড়ুন',
    upload_palm: 'হাতের ছবি আপলোড করুন',
    birth_details: 'জন্মের তথ্য দিন',
    your_readings: 'আপনার রিডিং সমূহ',
    no_readings: 'এখনো কোনো রিডিং নেই',
    create_reading: 'রিডিং তৈরি করুন',
    birth_date: 'জন্ম তারিখ',
    birth_time: 'জন্ম সময়',
    birth_place: 'জন্মস্থান',
    latitude: 'অক্ষাংশ',
    longitude: 'দ্রাঘিমাংশ',
    submit: 'জমা দিন',
    loading: 'লোড হচ্ছে...',
    confidence: 'নির্ভরযোগ্যতা',
    zodiac_sign: 'রাশি',
    moon_sign: 'চন্দ্র রাশি',
    rising_sign: 'লগ্ন',
    palm_readings: 'হস্তরেখা রিডিং',
    astrology_readings: 'জ্যোতিষ রিডিং'
  },
  hindi: {
    welcome: '🌟 भविष्य जानें',
    welcome_desc: 'हस्तरेखा और ज्योतिष के माध्यम से अपना भविष्य खोजें',
    create_account: 'खाता बनाएं',
    name: 'नाम',
    email: 'ईमेल',
    language: 'भाषा',
    palm_reading: '🖐️ हस्तरेखा देखें',
    astrology: '✨ ज्योतिष पढ़ें',
    upload_palm: 'हथेली की फोटो अपलोड करें',
    birth_details: 'जन्म विवरण दें',
    your_readings: 'आपकी रीडिंग',
    no_readings: 'अभी तक कोई रीडिंग नहीं',
    create_reading: 'रीडिंग बनाएं',
    birth_date: 'जन्म तिथि',
    birth_time: 'जन्म समय',
    birth_place: 'जन्म स्थान',
    latitude: 'अक्षांश',
    longitude: 'देशांतर',
    submit: 'जमा करें',
    loading: 'लोड हो रहा है...',
    confidence: 'विश्वसनीयता',
    zodiac_sign: 'राशि',
    moon_sign: 'चंद्र राशि',
    rising_sign: 'लग्न',
    palm_readings: 'हस्तरेखा रीडिंग',
    astrology_readings: 'ज्योतिष रीडिंग'
  },
  english: {
    welcome: '🌟 Discover Your Future',
    welcome_desc: 'Unlock your destiny through palmistry and astrology',
    create_account: 'Create Account',
    name: 'Name',
    email: 'Email',
    language: 'Language',
    palm_reading: '🖐️ Palm Reading',
    astrology: '✨ Astrology',
    upload_palm: 'Upload Palm Photo',
    birth_details: 'Enter Birth Details',
    your_readings: 'Your Readings',
    no_readings: 'No readings yet',
    create_reading: 'Create Reading',
    birth_date: 'Birth Date',
    birth_time: 'Birth Time',
    birth_place: 'Birth Place',
    latitude: 'Latitude',
    longitude: 'Longitude',
    submit: 'Submit',
    loading: 'Loading...',
    confidence: 'Confidence',
    zodiac_sign: 'Zodiac Sign',
    moon_sign: 'Moon Sign',
    rising_sign: 'Rising Sign',
    palm_readings: 'Palm Readings',
    astrology_readings: 'Astrology Readings'
  }
};

function App() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('english');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [palmReadings, setPalmReadings] = useState<PalmReading[]>([]);
  const [astrologyReadings, setAstrologyReadings] = useState<AstrologyReading[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // User creation form
  const [userForm, setUserForm] = useState<CreateUserInput>({
    name: '',
    email: '',
    preferred_language: 'english'
  });

  // Astrology form
  const [astrologyForm, setAstrologyForm] = useState<Omit<CreateAstrologyReadingInput, 'user_id'>>({
    birth_date: new Date(),
    birth_time: '',
    birth_place: '',
    birth_latitude: 0,
    birth_longitude: 0,
    reading_text_bengali: '',
    reading_text_hindi: '',
    reading_text_english: '',
    zodiac_sign: '',
    moon_sign: '',
    rising_sign: ''
  });

  const t = translations[currentLanguage];

  // Load user readings
  const loadReadings = useCallback(async (userId: number) => {
    try {
      const [palmReadingsResult, astrologyReadingsResult] = await Promise.all([
        trpc.getUserPalmReadings.query({ user_id: userId, language: currentLanguage }),
        trpc.getUserAstrologyReadings.query({ user_id: userId, language: currentLanguage })
      ]);
      setPalmReadings(palmReadingsResult);
      setAstrologyReadings(astrologyReadingsResult);
    } catch (error) {
      console.error('Failed to load readings:', error);
    }
  }, [currentLanguage]);

  // Create user account
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newUser = await trpc.createUser.mutate(userForm);
      setUser(newUser);
      setCurrentLanguage(newUser.preferred_language);
      await loadReadings(newUser.id);
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle palm image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setSelectedImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload palm image and get reading
  const handlePalmReading = async () => {
    if (!selectedImage || !user) return;
    
    setIsLoading(true);
    try {
      const uploadInput: UploadImageInput = {
        user_id: user.id,
        image_data: selectedImage,
        language: currentLanguage
      };
      
      const reading = await trpc.uploadPalmImage.mutate(uploadInput);
      setPalmReadings((prev: PalmReading[]) => [reading, ...prev]);
      setSelectedImage(null);
    } catch (error) {
      console.error('Failed to upload palm image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create astrology reading
  const handleAstrologyReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const fullForm: CreateAstrologyReadingInput = {
        ...astrologyForm,
        user_id: user.id,
        reading_text_bengali: 'AI Generated Bengali Reading...',
        reading_text_hindi: 'AI Generated Hindi Reading...',
        reading_text_english: 'AI Generated English Reading...',
        zodiac_sign: 'Aries', // These would be calculated by AI
        moon_sign: 'Taurus',
        rising_sign: 'Gemini'
      };
      
      const reading = await trpc.createAstrologyReading.mutate(fullForm);
      setAstrologyReadings((prev: AstrologyReading[]) => [reading, ...prev]);
      
      // Reset form
      setAstrologyForm({
        birth_date: new Date(),
        birth_time: '',
        birth_place: '',
        birth_latitude: 0,
        birth_longitude: 0,
        reading_text_bengali: '',
        reading_text_hindi: '',
        reading_text_english: '',
        zodiac_sign: '',
        moon_sign: '',
        rising_sign: ''
      });
    } catch (error) {
      console.error('Failed to create astrology reading:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get reading text in current language
  const getReadingText = (reading: PalmReading | AstrologyReading): string => {
    switch (currentLanguage) {
      case 'bengali': return reading.reading_text_bengali;
      case 'hindi': return reading.reading_text_hindi;
      default: return reading.reading_text_english;
    }
  };

  // Language selection header
  const LanguageSelector = () => (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
      <h1 className="text-xl font-bold">{t.welcome}</h1>
      <Select value={currentLanguage} onValueChange={(value: Language) => setCurrentLanguage(value)}>
        <SelectTrigger className="w-32 bg-white/20 border-white/30 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="english">English</SelectItem>
          <SelectItem value="hindi">हिंदी</SelectItem>
          <SelectItem value="bengali">বাংলা</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  // User creation form
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <LanguageSelector />
        
        <div className="container mx-auto p-4 max-w-md">
          <Card className="mt-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t.welcome}</CardTitle>
              <CardDescription>{t.welcome_desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="name">{t.name}</Label>
                  <Input
                    id="name"
                    value={userForm.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUserForm((prev: CreateUserInput) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">{t.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUserForm((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                </div>
                
                <div>
                  <Label>{t.language}</Label>
                  <Select
                    value={userForm.preferred_language}
                    onValueChange={(value: Language) =>
                      setUserForm((prev: CreateUserInput) => ({ ...prev, preferred_language: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">हिंदी</SelectItem>
                      <SelectItem value="bengali">বাংলা</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t.loading : t.create_account}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main application
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <LanguageSelector />
      
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6 text-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Welcome, {user.name}! 👋
          </h2>
        </div>

        <Tabs defaultValue="palmistry" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="palmistry">{t.palm_reading}</TabsTrigger>
            <TabsTrigger value="astrology">{t.astrology}</TabsTrigger>
            <TabsTrigger value="readings">{t.your_readings}</TabsTrigger>
          </TabsList>

          {/* Palm Reading Tab */}
          <TabsContent value="palmistry">
            <Card>
              <CardHeader>
                <CardTitle>{t.palm_reading}</CardTitle>
                <CardDescription>{t.upload_palm}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mb-4"
                  />
                  
                  {selectedImage && (
                    <div className="space-y-4">
                      <img
                        src={selectedImage}
                        alt="Palm"
                        className="w-full max-w-sm mx-auto rounded-lg shadow-md"
                      />
                      <Button
                        onClick={handlePalmReading}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? t.loading : t.create_reading}
                      </Button>
                    </div>
                  )}
                </div>
                
                {isLoading && (
                  <Alert>
                    <AlertDescription>
                      AI is analyzing your palm... This may take a few moments.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Astrology Tab */}
          <TabsContent value="astrology">
            <Card>
              <CardHeader>
                <CardTitle>{t.astrology}</CardTitle>
                <CardDescription>{t.birth_details}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAstrologyReading} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="birth_date">{t.birth_date}</Label>
                      <Input
                        id="birth_date"
                        type="date"
                        value={astrologyForm.birth_date.toISOString().split('T')[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setAstrologyForm(prev => ({ ...prev, birth_date: new Date(e.target.value) }))
                        }
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="birth_time">{t.birth_time}</Label>
                      <Input
                        id="birth_time"
                        type="time"
                        value={astrologyForm.birth_time}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setAstrologyForm(prev => ({ ...prev, birth_time: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="birth_place">{t.birth_place}</Label>
                    <Input
                      id="birth_place"
                      value={astrologyForm.birth_place}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setAstrologyForm(prev => ({ ...prev, birth_place: e.target.value }))
                      }
                      placeholder="City, Country"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitude">{t.latitude}</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="0.000001"
                        value={astrologyForm.birth_latitude}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setAstrologyForm(prev => ({ ...prev, birth_latitude: parseFloat(e.target.value) || 0 }))
                        }
                        placeholder="23.8103"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="longitude">{t.longitude}</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="0.000001"
                        value={astrologyForm.birth_longitude}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setAstrologyForm(prev => ({ ...prev, birth_longitude: parseFloat(e.target.value) || 0 }))
                        }
                        placeholder="90.4125"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t.loading : t.create_reading}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Readings History Tab */}
          <TabsContent value="readings">
            <div className="space-y-6">
              {/* Palm Readings */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.palm_readings}</CardTitle>
                </CardHeader>
                <CardContent>
                  {palmReadings.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">{t.no_readings}</p>
                  ) : (
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {palmReadings.map((reading: PalmReading) => (
                          <div key={reading.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary">
                                {reading.created_at.toLocaleDateString()}
                              </Badge>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">{t.confidence}:</span>
                                <Progress value={reading.confidence_score * 100} className="w-20" />
                                <span className="text-sm font-medium">
                                  {Math.round(reading.confidence_score * 100)}%
                                </span>
                              </div>
                            </div>
                            
                            <img
                              src={reading.image_url}
                              alt="Palm"
                              className="w-32 h-32 object-cover rounded-md mx-auto"
                            />
                            
                            <div className="prose prose-sm max-w-none">
                              <p className="text-gray-700 leading-relaxed">
                                {getReadingText(reading)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Astrology Readings */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.astrology_readings}</CardTitle>
                </CardHeader>
                <CardContent>
                  {astrologyReadings.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">{t.no_readings}</p>
                  ) : (
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {astrologyReadings.map((reading: AstrologyReading) => (
                          <div key={reading.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary">
                                {reading.created_at.toLocaleDateString()}
                              </Badge>
                              <div className="text-sm text-gray-600">
                                {reading.birth_place}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-xs text-gray-500">{t.zodiac_sign}</p>
                                <p className="font-medium">{reading.zodiac_sign}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">{t.moon_sign}</p>
                                <p className="font-medium">{reading.moon_sign}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">{t.rising_sign}</p>
                                <p className="font-medium">{reading.rising_sign}</p>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="prose prose-sm max-w-none">
                              <p className="text-gray-700 leading-relaxed">
                                {getReadingText(reading)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
