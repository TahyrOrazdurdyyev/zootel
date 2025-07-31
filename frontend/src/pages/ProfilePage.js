import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserIcon, 
  PencilIcon,
  PlusIcon,
  TrashIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  
  const [profileData, setProfileData] = useState({
    firstName: 'Анна',
    lastName: 'Петрова',
    gender: 'female',
    dateOfBirth: '1990-05-15',
    email: 'anna.petrova@example.com',
    phone: '+79161234567',
    address: 'ул. Пушкина, д. 10, кв. 5',
    country: 'Russia',
    state: 'Moscow',
    city: 'Moscow',
    timezone: 'Europe/Moscow',
    emergencyName: 'Петров Сергей',
    emergencyRelation: 'муж',
    emergencyPhone: '+79167654321',
    vetName: 'Ветклиника "Доктор Айболит"',
    vetClinic: 'Центр ветеринарной медицины',
    vetPhone: '+74951234567',
    notificationMethods: ['email', 'push'],
    marketingOptIn: true
  });

  const [pets, setPets] = useState([
    {
      id: 1,
      name: 'Мурзик',
      species: 'cat',
      breed: 'Британская короткошерстная',
      gender: 'male',
      dateOfBirth: '2020-03-10',
      weight: 4.2,
      microchipId: 'ABC123456789',
      sterilized: true,
      photoUrl: null,
      vaccinations: [
        { vaccine: 'Комплексная вакцина', date: '2023-03-15', expiry: '2024-03-15' },
        { vaccine: 'Бешенство', date: '2023-03-15', expiry: '2024-03-15' }
      ],
      allergies: ['курица'],
      medications: 'Витамины для шерсти - 1 таблетка в день',
      specialNeeds: 'Диетическое питание',
      vetContact: 'Доктор Иванов, +74951234567',
      notes: 'Очень спокойный и ласковый кот'
    }
  ]);

  const tabs = [
    { id: 'personal', name: 'Личные данные', icon: UserIcon },
    { id: 'contact', name: 'Контакты', icon: UserIcon },
    { id: 'emergency', name: 'Экстренные контакты', icon: UserIcon },
    { id: 'preferences', name: 'Настройки', icon: UserIcon },
    { id: 'pets', name: 'Питомцы', icon: UserIcon }
  ];

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const addPet = () => {
    const newPet = {
      id: Date.now(),
      name: '',
      species: '',
      breed: '',
      gender: '',
      dateOfBirth: '',
      weight: 0,
      microchipId: '',
      sterilized: false,
      photoUrl: null,
      vaccinations: [],
      allergies: [],
      medications: '',
      specialNeeds: '',
      vetContact: '',
      notes: ''
    };
    setPets([...pets, newPet]);
  };

  const updatePet = (petId, updates) => {
    setPets(pets.map(pet => 
      pet.id === petId ? { ...pet, ...updates } : pet
    ));
  };

  const deletePet = (petId) => {
    setPets(pets.filter(pet => pet.id !== petId));
  };

  const renderPersonalTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Имя
          </label>
          <input
            type="text"
            value={profileData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Фамилия
          </label>
          <input
            type="text"
            value={profileData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Пол
          </label>
          <select
            value={profileData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          >
            <option value="">Выберите пол</option>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
            <option value="other">Другой</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Дата рождения (возраст: {calculateAge(profileData.dateOfBirth)} лет)
          </label>
          <input
            type="date"
            value={profileData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Фото профиля
        </label>
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            <UserIcon className="w-10 h-10 text-gray-400" />
          </div>
          {isEditing && (
            <button className="btn-secondary flex items-center space-x-2">
              <CameraIcon className="w-4 h-4" />
              <span>Загрузить фото</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderContactTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          value={profileData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          disabled={!isEditing}
          className="input-field"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Телефон
        </label>
        <PhoneInput
          country={'ru'}
          value={profileData.phone}
          onChange={(phone) => handleInputChange('phone', phone)}
          disabled={!isEditing}
          inputClass="input-field !pl-14"
          containerClass="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Адрес
        </label>
        <textarea
          value={profileData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          disabled={!isEditing}
          rows={3}
          className="input-field"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Страна
          </label>
          <select
            value={profileData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          >
            <option value="Russia">Россия</option>
            <option value="Ukraine">Украина</option>
            <option value="Belarus">Беларусь</option>
            <option value="Kazakhstan">Казахстан</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Регион
          </label>
          <input
            type="text"
            value={profileData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Город
          </label>
          <input
            type="text"
            value={profileData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Часовой пояс
        </label>
        <select
          value={profileData.timezone}
          onChange={(e) => handleInputChange('timezone', e.target.value)}
          disabled={!isEditing}
          className="input-field"
        >
          <option value="Europe/Moscow">Москва (GMT+3)</option>
          <option value="Europe/Kiev">Киев (GMT+2)</option>
          <option value="Asia/Yekaterinburg">Екатеринбург (GMT+5)</option>
          <option value="Asia/Novosibirsk">Новосибирск (GMT+7)</option>
        </select>
      </div>
    </div>
  );

  const renderEmergencyTab = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Экстренный контакт</h3>
        <p className="text-sm text-yellow-700">
          Укажите контакт человека, к которому можно обратиться в экстренной ситуации
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Имя и отношение
          </label>
          <input
            type="text"
            value={profileData.emergencyName}
            onChange={(e) => handleInputChange('emergencyName', e.target.value)}
            disabled={!isEditing}
            className="input-field"
            placeholder="Иван Петров (брат)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Телефон экстренного контакта
          </label>
          <PhoneInput
            country={'ru'}
            value={profileData.emergencyPhone}
            onChange={(phone) => handleInputChange('emergencyPhone', phone)}
            disabled={!isEditing}
            inputClass="input-field !pl-14"
            containerClass="w-full"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Ветеринарный контакт</h3>
        <p className="text-sm text-blue-700">
          Контакты вашего основного ветеринара или клиники
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Имя ветеринара
          </label>
          <input
            type="text"
            value={profileData.vetName}
            onChange={(e) => handleInputChange('vetName', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название клиники
          </label>
          <input
            type="text"
            value={profileData.vetClinic}
            onChange={(e) => handleInputChange('vetClinic', e.target.value)}
            disabled={!isEditing}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Телефон ветклиники
          </label>
          <PhoneInput
            country={'ru'}
            value={profileData.vetPhone}
            onChange={(phone) => handleInputChange('vetPhone', phone)}
            disabled={!isEditing}
            inputClass="input-field !pl-14"
            containerClass="w-full"
          />
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Уведомления</h3>
        <div className="space-y-3">
          {[
            { id: 'email', label: 'Email уведомления' },
            { id: 'push', label: 'Push уведомления' },
            { id: 'sms', label: 'SMS уведомления' }
          ].map((method) => (
            <label key={method.id} className="flex items-center">
              <input
                type="checkbox"
                checked={profileData.notificationMethods.includes(method.id)}
                onChange={(e) => {
                  const methods = profileData.notificationMethods;
                  if (e.target.checked) {
                    handleInputChange('notificationMethods', [...methods, method.id]);
                  } else {
                    handleInputChange('notificationMethods', methods.filter(m => m !== method.id));
                  }
                }}
                disabled={!isEditing}
                className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{method.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Маркетинг</h3>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={profileData.marketingOptIn}
            onChange={(e) => handleInputChange('marketingOptIn', e.target.checked)}
            disabled={!isEditing}
            className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            Получать маркетинговые материалы и специальные предложения
          </span>
        </label>
      </div>
    </div>
  );

  const renderPetsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Мои питомцы</h3>
        <button
          onClick={addPet}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Добавить питомца</span>
        </button>
      </div>

      <div className="space-y-6">
        {pets.map((pet) => (
          <div key={pet.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-lg font-medium text-gray-900">
                {pet.name || 'Новый питомец'}
              </h4>
              <button
                onClick={() => deletePet(pet.id)}
                className="text-red-500 hover:text-red-700"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Кличка
                </label>
                <input
                  type="text"
                  value={pet.name}
                  onChange={(e) => updatePet(pet.id, { name: e.target.value })}
                  className="input-field"
                  placeholder="Кличка питомца"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Вид
                </label>
                <select
                  value={pet.species}
                  onChange={(e) => updatePet(pet.id, { species: e.target.value })}
                  className="input-field"
                >
                  <option value="">Выберите вид</option>
                  <option value="dog">Собака</option>
                  <option value="cat">Кошка</option>
                  <option value="bird">Птица</option>
                  <option value="rabbit">Кролик</option>
                  <option value="fish">Рыба</option>
                  <option value="other">Другое</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Порода
                </label>
                <input
                  type="text"
                  value={pet.breed}
                  onChange={(e) => updatePet(pet.id, { breed: e.target.value })}
                  className="input-field"
                  placeholder="Порода"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Пол
                </label>
                <select
                  value={pet.gender}
                  onChange={(e) => updatePet(pet.id, { gender: e.target.value })}
                  className="input-field"
                >
                  <option value="">Выберите пол</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дата рождения (возраст: {pet.dateOfBirth ? calculateAge(pet.dateOfBirth) : 0} лет)
                </label>
                <input
                  type="date"
                  value={pet.dateOfBirth}
                  onChange={(e) => updatePet(pet.id, { dateOfBirth: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Вес (кг)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pet.weight}
                  onChange={(e) => updatePet(pet.id, { weight: parseFloat(e.target.value) })}
                  className="input-field"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Номер микрочипа
                </label>
                <input
                  type="text"
                  value={pet.microchipId}
                  onChange={(e) => updatePet(pet.id, { microchipId: e.target.value })}
                  className="input-field"
                  placeholder="ABC123456789"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={pet.sterilized}
                    onChange={(e) => updatePet(pet.id, { sterilized: e.target.checked })}
                    className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Стерилизован/кастрирован
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Аллергии
                </label>
                <input
                  type="text"
                  value={pet.allergies.join(', ')}
                  onChange={(e) => updatePet(pet.id, { allergies: e.target.value.split(', ').filter(a => a.trim()) })}
                  className="input-field"
                  placeholder="курица, говядина"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Лекарства и дозировки
                </label>
                <textarea
                  value={pet.medications}
                  onChange={(e) => updatePet(pet.id, { medications: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder="Витамины для шерсти - 1 таблетка в день"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Особые потребности
                </label>
                <textarea
                  value={pet.specialNeeds}
                  onChange={(e) => updatePet(pet.id, { specialNeeds: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder="Диетическое питание, особенности поведения"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Заметки
                </label>
                <textarea
                  value={pet.notes}
                  onChange={(e) => updatePet(pet.id, { notes: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Дополнительная информация о питомце"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Профиль пользователя
              </h1>
              <p className="text-gray-600">
                Управляйте своей личной информацией и питомцами
              </p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`btn-${isEditing ? 'secondary' : 'primary'} flex items-center space-x-2`}
            >
              <PencilIcon className="w-4 h-4" />
              <span>{isEditing ? 'Отменить' : 'Редактировать'}</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'personal' && renderPersonalTab()}
            {activeTab === 'contact' && renderContactTab()}
            {activeTab === 'emergency' && renderEmergencyTab()}
            {activeTab === 'preferences' && renderPreferencesTab()}
            {activeTab === 'pets' && renderPetsTab()}
          </div>

          {isEditing && (
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary"
                >
                  Отменить
                </button>
                <button
                  onClick={() => {
                    // Save profile data
                    setIsEditing(false);
                  }}
                  className="btn-primary"
                >
                  Сохранить изменения
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 